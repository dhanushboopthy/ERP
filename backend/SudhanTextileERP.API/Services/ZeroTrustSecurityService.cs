using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ZERO TRUST SECURITY SERVICE - Phase-3 Ultra Enterprise Security
// Implements: Device Fingerprinting, Geo Anomaly Detection, Token Binding, Behavioral Analysis
// ═══════════════════════════════════════════════════════════════════════════════════════════

public interface IZeroTrustSecurityService
{
    Task<DeviceFingerprint> RegisterDeviceFingerprintAsync(string userId, DeviceFingerprintRequest request);
    Task<bool> ValidateDeviceFingerprintAsync(string userId, string sessionToken, DeviceFingerprintRequest request);
    Task<GeoAnomalyResult> DetectGeoAnomalyAsync(string userId, string ipAddress, string? lastKnownIp);
    Task<bool> ValidateTokenBindingAsync(string token, string deviceId, string sessionId);
    Task<SessionValidationResult> ContinuousSessionValidationAsync(string sessionToken);
    Task<StepUpAuthResult> RequireStepUpAuthenticationAsync(string userId, PrivilegeAction action);
    Task<BehavioralAnalysisResult> AnalyzeApiBehaviorAsync(string userId, ApiRequestContext context);
    Task<ZeroTrustDashboard> GetZeroTrustDashboardAsync();
}

public class ZeroTrustSecurityService : IZeroTrustSecurityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ZeroTrustSecurityService> _logger;
    private readonly ISecurityAuditService _auditService;
    
    // In-memory stores for real-time analysis (in production, use Redis)
    private static readonly ConcurrentDictionary<string, List<ApiRequestLog>> _userApiPatterns = new();
    private static readonly ConcurrentDictionary<string, DeviceFingerprint> _deviceFingerprints = new();
    private static readonly ConcurrentDictionary<string, GeoLocation> _userLastLocations = new();
    private static readonly ConcurrentDictionary<string, SessionState> _activeSessions = new();
    private static readonly ConcurrentDictionary<string, int> _failedAttempts = new();
    private static readonly ConcurrentBag<SecurityIncident> _securityIncidents = new();

    // Configurable thresholds
    private const int MaxApiRequestsPerMinute = 100;
    private const int MaxFailedAttemptsBeforeLockout = 5;
    private const double ImpossibleTravelSpeedKmH = 900; // Faster than commercial flights
    private const int SessionRevalidationIntervalMinutes = 15;
    private const int StepUpAuthValidityMinutes = 5;

    public ZeroTrustSecurityService(
        ApplicationDbContext context,
        ILogger<ZeroTrustSecurityService> logger,
        ISecurityAuditService auditService)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
    }

    // Helper method to log security events
    private async Task LogZeroTrustEventAsync(SecurityEventType eventType, string description, 
        string? userId = null, SecuritySeverity? severity = null, object? details = null)
    {
        await _auditService.LogSecurityEventAsync(eventType, description, userId, null, details, severity);
    }

    #region Device Fingerprinting

    /// <summary>
    /// Registers a new device fingerprint for a user
    /// </summary>
    public async Task<DeviceFingerprint> RegisterDeviceFingerprintAsync(string userId, DeviceFingerprintRequest request)
    {
        var fingerprint = new DeviceFingerprint
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            DeviceHash = GenerateDeviceHash(request),
            UserAgent = request.UserAgent,
            ScreenResolution = request.ScreenResolution,
            Timezone = request.Timezone,
            Language = request.Language,
            Platform = request.Platform,
            IsTrusted = false, // Requires verification
            FirstSeenAt = DateTime.UtcNow,
            LastSeenAt = DateTime.UtcNow,
            RiskScore = CalculateDeviceRiskScore(request)
        };

        _deviceFingerprints[fingerprint.Id] = fingerprint;

        await LogZeroTrustEventAsync(
            SecurityEventType.LoginSuccess,
            $"New device registered: {fingerprint.Platform} - {fingerprint.UserAgent?.Substring(0, Math.Min(50, fingerprint.UserAgent?.Length ?? 0))}",
            userId,
            SecuritySeverity.Info
        );

        _logger.LogInformation("Device fingerprint registered for user {UserId}: {DeviceId}", userId, fingerprint.Id);
        return fingerprint;
    }

    /// <summary>
    /// Validates device fingerprint matches expected device
    /// </summary>
    public async Task<bool> ValidateDeviceFingerprintAsync(string userId, string sessionToken, DeviceFingerprintRequest request)
    {
        var currentHash = GenerateDeviceHash(request);
        
        // Find matching fingerprint for user
        var existingFingerprint = _deviceFingerprints.Values
            .FirstOrDefault(f => f.UserId == userId && f.DeviceHash == currentHash);

        if (existingFingerprint == null)
        {
            // New device detected - potential session hijack
            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                "Session used from unknown device. Expected fingerprint not found.",
                userId,
                SecuritySeverity.High,
                new { IpAddress = request.IpAddress }
            );

            RecordSecurityIncident(new SecurityIncident
            {
                Type = IncidentType.SessionHijackAttempt,
                UserId = userId,
                Description = "Session accessed from unregistered device",
                DetectedAt = DateTime.UtcNow,
                Severity = IncidentSeverity.High
            });

            return false;
        }

        // Check for fingerprint drift (device characteristics changed)
        var driftScore = CalculateFingerprintDrift(existingFingerprint, request);
        if (driftScore > 0.3) // 30% drift threshold
        {
            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                $"Device fingerprint drift detected: {driftScore:P0}",
                userId,
                SecuritySeverity.Medium
            );

            return false;
        }

        existingFingerprint.LastSeenAt = DateTime.UtcNow;
        return true;
    }

    private string GenerateDeviceHash(DeviceFingerprintRequest request)
    {
        var components = $"{request.UserAgent}|{request.ScreenResolution}|{request.Timezone}|{request.Platform}|{request.Language}";
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(components));
        return Convert.ToBase64String(bytes);
    }

    private double CalculateDeviceRiskScore(DeviceFingerprintRequest request)
    {
        double risk = 0;

        // Check for suspicious indicators
        if (string.IsNullOrEmpty(request.UserAgent)) risk += 0.3;
        if (request.UserAgent?.Contains("curl") == true) risk += 0.2;
        if (request.UserAgent?.Contains("python") == true) risk += 0.2;
        if (request.Timezone == null) risk += 0.1;
        if (request.ScreenResolution == "0x0") risk += 0.2;

        return Math.Min(risk, 1.0);
    }

    private double CalculateFingerprintDrift(DeviceFingerprint original, DeviceFingerprintRequest current)
    {
        int totalChecks = 5;
        int differences = 0;

        if (original.UserAgent != current.UserAgent) differences++;
        if (original.ScreenResolution != current.ScreenResolution) differences++;
        if (original.Timezone != current.Timezone) differences++;
        if (original.Platform != current.Platform) differences++;
        if (original.Language != current.Language) differences++;

        return (double)differences / totalChecks;
    }

    #endregion

    #region Geo Anomaly Detection

    /// <summary>
    /// Detects impossible travel and geo-based anomalies
    /// </summary>
    public async Task<GeoAnomalyResult> DetectGeoAnomalyAsync(string userId, string ipAddress, string? lastKnownIp)
    {
        var result = new GeoAnomalyResult
        {
            IsAnomaly = false,
            CheckedAt = DateTime.UtcNow
        };

        // Get current location from IP
        var currentLocation = await ResolveGeoLocationAsync(ipAddress);
        result.CurrentLocation = currentLocation;

        // Check if we have previous location
        if (_userLastLocations.TryGetValue(userId, out var lastLocation))
        {
            result.PreviousLocation = lastLocation;

            // Calculate distance and time
            var distance = CalculateDistanceKm(lastLocation.Latitude, lastLocation.Longitude, 
                                                currentLocation.Latitude, currentLocation.Longitude);
            var timeDiff = (DateTime.UtcNow - lastLocation.Timestamp).TotalHours;

            // Avoid division by zero
            if (timeDiff > 0)
            {
                var requiredSpeed = distance / timeDiff;
                result.RequiredSpeedKmH = requiredSpeed;
                result.DistanceKm = distance;

                // Impossible travel detection
                if (requiredSpeed > ImpossibleTravelSpeedKmH)
                {
                    result.IsAnomaly = true;
                    result.AnomalyType = GeoAnomalyType.ImpossibleTravel;
                    result.RiskScore = Math.Min(1.0, requiredSpeed / 2000); // Normalize to 0-1

                    await LogZeroTrustEventAsync(
                        SecurityEventType.SuspiciousActivity,
                        $"Impossible travel: {distance:F0}km in {timeDiff:F1}h = {requiredSpeed:F0}km/h (Max: {ImpossibleTravelSpeedKmH}km/h)",
                        userId,
                        SecuritySeverity.Critical,
                        new { IpAddress = ipAddress }
                    );

                    RecordSecurityIncident(new SecurityIncident
                    {
                        Type = IncidentType.ImpossibleTravel,
                        UserId = userId,
                        Description = $"Login from {currentLocation.City}, {currentLocation.Country} after {lastLocation.City}, {lastLocation.Country} - Impossible travel detected",
                        DetectedAt = DateTime.UtcNow,
                        Severity = IncidentSeverity.Critical,
                        IpAddress = ipAddress
                    });
                }
            }

            // High-risk country detection
            if (IsHighRiskCountry(currentLocation.CountryCode))
            {
                result.IsAnomaly = true;
                result.AnomalyType = GeoAnomalyType.HighRiskCountry;
                result.RiskScore = 0.8;

                await LogZeroTrustEventAsync(
                    SecurityEventType.SuspiciousActivity,
                    $"Login attempt from high-risk country: {currentLocation.Country}",
                    userId,
                    SecuritySeverity.High,
                    new { IpAddress = ipAddress }
                );
            }
        }

        // Update last known location
        currentLocation.Timestamp = DateTime.UtcNow;
        _userLastLocations[userId] = currentLocation;

        return result;
    }

    private async Task<GeoLocation> ResolveGeoLocationAsync(string ipAddress)
    {
        // In production, use a real GeoIP service like MaxMind
        // For now, return mock data based on IP patterns
        
        // Simulate geo resolution
        await Task.Delay(1); // Simulate async operation
        
        return new GeoLocation
        {
            IpAddress = ipAddress,
            City = "Chennai",
            Country = "India",
            CountryCode = "IN",
            Latitude = 13.0827,
            Longitude = 80.2707,
            Timestamp = DateTime.UtcNow
        };
    }

    private double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double degrees) => degrees * Math.PI / 180;

    private bool IsHighRiskCountry(string countryCode)
    {
        var highRiskCountries = new[] { "KP", "IR", "SY", "CU", "RU" }; // Example list
        return highRiskCountries.Contains(countryCode);
    }

    #endregion

    #region Token Binding

    /// <summary>
    /// Validates that a token is bound to the correct device and session
    /// </summary>
    public async Task<bool> ValidateTokenBindingAsync(string token, string deviceId, string sessionId)
    {
        if (!_activeSessions.TryGetValue(sessionId, out var session))
        {
            await LogZeroTrustEventAsync(
                SecurityEventType.UnauthorizedApiAccess,
                "Session not found for token binding validation",
                null,
                SecuritySeverity.High
            );

            RecordSecurityIncident(new SecurityIncident
            {
                Type = IncidentType.TokenReplayAttempt,
                Description = "Token used with unknown session",
                DetectedAt = DateTime.UtcNow,
                Severity = IncidentSeverity.High
            });

            return false;
        }

        // Verify device binding
        if (session.BoundDeviceId != deviceId)
        {
            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                $"Token used from different device. Expected: {session.BoundDeviceId}, Got: {deviceId}",
                session.UserId,
                SecuritySeverity.Critical
            );

            RecordSecurityIncident(new SecurityIncident
            {
                Type = IncidentType.SessionHijackAttempt,
                UserId = session.UserId,
                Description = "Token used from non-bound device",
                DetectedAt = DateTime.UtcNow,
                Severity = IncidentSeverity.Critical
            });

            return false;
        }

        // Verify token hash matches session
        var tokenHash = ComputeTokenHash(token);
        if (session.TokenHash != tokenHash)
        {
            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                "Token hash does not match session binding",
                session.UserId,
                SecuritySeverity.Critical
            );

            RecordSecurityIncident(new SecurityIncident
            {
                Type = IncidentType.TokenReplayAttempt,
                UserId = session.UserId,
                Description = "Potential token replay or modification detected",
                DetectedAt = DateTime.UtcNow,
                Severity = IncidentSeverity.Critical
            });

            return false;
        }

        return true;
    }

    private string ComputeTokenHash(string token)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    #endregion

    #region Continuous Session Validation

    /// <summary>
    /// Continuously validates session state
    /// </summary>
    public async Task<SessionValidationResult> ContinuousSessionValidationAsync(string sessionToken)
    {
        var result = new SessionValidationResult
        {
            ValidatedAt = DateTime.UtcNow,
            IsValid = true
        };

        var sessionId = ComputeTokenHash(sessionToken);

        if (!_activeSessions.TryGetValue(sessionId, out var session))
        {
            result.IsValid = false;
            result.InvalidReason = "Session not found";
            return result;
        }

        // Check session expiry
        if (session.ExpiresAt < DateTime.UtcNow)
        {
            result.IsValid = false;
            result.InvalidReason = "Session expired";
            result.RequiresReauth = true;
            return result;
        }

        // Check if revalidation is due
        var timeSinceLastValidation = DateTime.UtcNow - session.LastValidatedAt;
        if (timeSinceLastValidation.TotalMinutes > SessionRevalidationIntervalMinutes)
        {
            result.RequiresRevalidation = true;
            session.LastValidatedAt = DateTime.UtcNow;
        }

        // Check for concurrent session from different location
        if (session.ConcurrentSessionDetected)
        {
            result.IsValid = false;
            result.InvalidReason = "Concurrent session detected from different location";
            result.RequiresReauth = true;

            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                "Session invalidated due to concurrent access from different location",
                session.UserId,
                SecuritySeverity.High
            );
        }

        result.SessionAge = DateTime.UtcNow - session.CreatedAt;
        result.LastActivityAge = DateTime.UtcNow - session.LastActivityAt;

        return result;
    }

    #endregion

    #region Step-Up Authentication

    /// <summary>
    /// Requires additional authentication for privileged operations
    /// </summary>
    public async Task<StepUpAuthResult> RequireStepUpAuthenticationAsync(string userId, PrivilegeAction action)
    {
        var result = new StepUpAuthResult
        {
            UserId = userId,
            Action = action,
            RequiredAt = DateTime.UtcNow,
            IsRequired = true
        };

        // Determine required authentication level based on action
        result.RequiredAuthLevel = action switch
        {
            PrivilegeAction.DeleteData => AuthLevel.MFA,
            PrivilegeAction.ExportData => AuthLevel.MFA,
            PrivilegeAction.ModifyPermissions => AuthLevel.MFA,
            PrivilegeAction.FinancialApproval => AuthLevel.MFAWithPin,
            PrivilegeAction.SystemConfiguration => AuthLevel.MFAWithApproval,
            PrivilegeAction.BulkOperations => AuthLevel.MFA,
            _ => AuthLevel.ReenterPassword
        };

        // Check if recent step-up is still valid
        var cacheKey = $"{userId}:{action}";
        if (_stepUpCache.TryGetValue(cacheKey, out var lastStepUp))
        {
            if ((DateTime.UtcNow - lastStepUp).TotalMinutes < StepUpAuthValidityMinutes)
            {
                result.IsRequired = false;
                result.ValidUntil = lastStepUp.AddMinutes(StepUpAuthValidityMinutes);
                return result;
            }
        }

        await LogZeroTrustEventAsync(
            SecurityEventType.SensitiveDataAccess,
            $"Step-up authentication required for: {action}",
            userId,
            SecuritySeverity.Info
        );

        result.ChallengeToken = GenerateChallengeToken();
        result.ValidUntil = DateTime.UtcNow.AddMinutes(StepUpAuthValidityMinutes);

        return result;
    }

    private static readonly ConcurrentDictionary<string, DateTime> _stepUpCache = new();

    private string GenerateChallengeToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    #endregion

    #region API Behavioral Analysis

    /// <summary>
    /// Analyzes API request patterns for anomalies
    /// </summary>
    public async Task<BehavioralAnalysisResult> AnalyzeApiBehaviorAsync(string userId, ApiRequestContext context)
    {
        var result = new BehavioralAnalysisResult
        {
            UserId = userId,
            AnalyzedAt = DateTime.UtcNow,
            IsAnomaly = false
        };

        // Get user's request history
        if (!_userApiPatterns.TryGetValue(userId, out var history))
        {
            history = new List<ApiRequestLog>();
            _userApiPatterns[userId] = history;
        }

        // Record current request
        var requestLog = new ApiRequestLog
        {
            Endpoint = context.Endpoint,
            Method = context.Method,
            Timestamp = DateTime.UtcNow,
            ResponseTime = context.ResponseTimeMs,
            StatusCode = context.StatusCode
        };
        history.Add(requestLog);

        // Keep only last hour of history
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);
        history.RemoveAll(r => r.Timestamp < oneHourAgo);

        // Analyze patterns
        var recentRequests = history.Where(r => r.Timestamp > DateTime.UtcNow.AddMinutes(-1)).ToList();

        // Check 1: Request rate anomaly
        if (recentRequests.Count > MaxApiRequestsPerMinute)
        {
            result.IsAnomaly = true;
            result.AnomalyType = BehavioralAnomalyType.HighRequestRate;
            result.RiskScore = Math.Min(1.0, (double)recentRequests.Count / MaxApiRequestsPerMinute / 2);
            result.Details = $"Excessive request rate: {recentRequests.Count} requests/minute";

            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                result.Details,
                userId,
                SecuritySeverity.High,
                new { IpAddress = context.IpAddress }
            );
        }

        // Check 2: Unusual endpoint access pattern
        var sensitiveEndpointAccess = recentRequests.Count(r => 
            r.Endpoint.Contains("/admin") || 
            r.Endpoint.Contains("/export") ||
            r.Endpoint.Contains("/bulk") ||
            r.Endpoint.Contains("/config"));

        if (sensitiveEndpointAccess > 10)
        {
            result.IsAnomaly = true;
            result.AnomalyType = BehavioralAnomalyType.SensitiveEndpointAbuse;
            result.RiskScore = Math.Max(result.RiskScore, 0.7);
            result.Details = $"Excessive sensitive endpoint access: {sensitiveEndpointAccess} in 1 minute";

            await LogZeroTrustEventAsync(
                SecurityEventType.SuspiciousActivity,
                result.Details,
                userId,
                SecuritySeverity.High,
                new { IpAddress = context.IpAddress }
            );
        }

        // Check 3: Sequential enumeration detection
        var sequentialIds = DetectSequentialEnumeration(recentRequests);
        if (sequentialIds)
        {
            result.IsAnomaly = true;
            result.AnomalyType = BehavioralAnomalyType.EnumerationAttempt;
            result.RiskScore = Math.Max(result.RiskScore, 0.8);
            result.Details = "Sequential ID enumeration pattern detected";

            RecordSecurityIncident(new SecurityIncident
            {
                Type = IncidentType.EnumerationAttack,
                UserId = userId,
                Description = "Sequential resource enumeration detected",
                DetectedAt = DateTime.UtcNow,
                Severity = IncidentSeverity.High,
                IpAddress = context.IpAddress
            });
        }

        // Check 4: Off-hours activity
        var localHour = DateTime.Now.Hour;
        if (localHour < 6 || localHour > 22)
        {
            result.RiskScore = Math.Max(result.RiskScore, 0.3);
            result.Flags.Add("OffHoursActivity");
        }

        return result;
    }

    private bool DetectSequentialEnumeration(List<ApiRequestLog> requests)
    {
        // Look for patterns like /api/items/1, /api/items/2, /api/items/3
        var idPattern = new System.Text.RegularExpressions.Regex(@"/(\d+)(?:/|$)");
        var ids = requests
            .Select(r => idPattern.Match(r.Endpoint))
            .Where(m => m.Success)
            .Select(m => int.Parse(m.Groups[1].Value))
            .ToList();

        if (ids.Count < 5) return false;

        // Check for sequential pattern
        var sorted = ids.OrderBy(x => x).ToList();
        int sequential = 0;
        for (int i = 1; i < sorted.Count; i++)
        {
            if (sorted[i] - sorted[i - 1] == 1) sequential++;
        }

        return sequential > ids.Count * 0.7; // 70% sequential = enumeration
    }

    #endregion

    #region Dashboard & Reporting

    /// <summary>
    /// Gets Zero Trust security dashboard metrics
    /// </summary>
    public async Task<ZeroTrustDashboard> GetZeroTrustDashboardAsync()
    {
        await Task.CompletedTask; // Async placeholder

        var last24Hours = DateTime.UtcNow.AddHours(-24);
        var recentIncidents = _securityIncidents.Where(i => i.DetectedAt > last24Hours).ToList();

        return new ZeroTrustDashboard
        {
            GeneratedAt = DateTime.UtcNow,
            ActiveSessions = _activeSessions.Count,
            RegisteredDevices = _deviceFingerprints.Count,
            
            // Incident metrics
            TotalIncidents24h = recentIncidents.Count,
            CriticalIncidents = recentIncidents.Count(i => i.Severity == IncidentSeverity.Critical),
            HighIncidents = recentIncidents.Count(i => i.Severity == IncidentSeverity.High),
            
            // Detection metrics
            ImpossibleTravelDetections = recentIncidents.Count(i => i.Type == IncidentType.ImpossibleTravel),
            SessionHijackAttempts = recentIncidents.Count(i => i.Type == IncidentType.SessionHijackAttempt),
            TokenReplayAttempts = recentIncidents.Count(i => i.Type == IncidentType.TokenReplayAttempt),
            EnumerationAttempts = recentIncidents.Count(i => i.Type == IncidentType.EnumerationAttack),
            
            // Trust scores
            OverallTrustScore = CalculateOverallTrustScore(recentIncidents),
            
            RecentIncidents = recentIncidents.OrderByDescending(i => i.DetectedAt).Take(10).ToList()
        };
    }

    private double CalculateOverallTrustScore(List<SecurityIncident> incidents)
    {
        double score = 100;
        foreach (var incident in incidents)
        {
            score -= incident.Severity switch
            {
                IncidentSeverity.Critical => 5,
                IncidentSeverity.High => 2,
                IncidentSeverity.Medium => 1,
                _ => 0.5
            };
        }
        return Math.Max(0, score);
    }

    private void RecordSecurityIncident(SecurityIncident incident)
    {
        incident.Id = Guid.NewGuid().ToString();
        _securityIncidents.Add(incident);
        _logger.LogWarning("Security Incident: {Type} - {Description}", incident.Type, incident.Description);
    }

    #endregion

    #region Session Management

    public void RegisterSession(string userId, string sessionToken, string deviceId)
    {
        var sessionId = ComputeTokenHash(sessionToken);
        var session = new SessionState
        {
            SessionId = sessionId,
            UserId = userId,
            BoundDeviceId = deviceId,
            TokenHash = ComputeTokenHash(sessionToken),
            CreatedAt = DateTime.UtcNow,
            LastValidatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(8)
        };
        _activeSessions[sessionId] = session;
    }

    public void UpdateSessionActivity(string sessionToken)
    {
        var sessionId = ComputeTokenHash(sessionToken);
        if (_activeSessions.TryGetValue(sessionId, out var session))
        {
            session.LastActivityAt = DateTime.UtcNow;
        }
    }

    public void InvalidateSession(string sessionToken)
    {
        var sessionId = ComputeTokenHash(sessionToken);
        _activeSessions.TryRemove(sessionId, out _);
    }

    #endregion
}

#region DTOs and Enums

public class DeviceFingerprintRequest
{
    public string? UserAgent { get; set; }
    public string? ScreenResolution { get; set; }
    public string? Timezone { get; set; }
    public string? Language { get; set; }
    public string? Platform { get; set; }
    public string? IpAddress { get; set; }
    public Dictionary<string, string> AdditionalProperties { get; set; } = new();
}

public class DeviceFingerprint
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DeviceHash { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? ScreenResolution { get; set; }
    public string? Timezone { get; set; }
    public string? Language { get; set; }
    public string? Platform { get; set; }
    public bool IsTrusted { get; set; }
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public double RiskScore { get; set; }
}

public class GeoLocation
{
    public string IpAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime Timestamp { get; set; }
}

public class GeoAnomalyResult
{
    public bool IsAnomaly { get; set; }
    public GeoAnomalyType AnomalyType { get; set; }
    public GeoLocation? CurrentLocation { get; set; }
    public GeoLocation? PreviousLocation { get; set; }
    public double DistanceKm { get; set; }
    public double RequiredSpeedKmH { get; set; }
    public double RiskScore { get; set; }
    public DateTime CheckedAt { get; set; }
}

public enum GeoAnomalyType
{
    None,
    ImpossibleTravel,
    HighRiskCountry,
    VpnDetected,
    TorExitNode
}

public class SessionState
{
    public string SessionId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string BoundDeviceId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastValidatedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool ConcurrentSessionDetected { get; set; }
}

public class SessionValidationResult
{
    public bool IsValid { get; set; }
    public string? InvalidReason { get; set; }
    public bool RequiresRevalidation { get; set; }
    public bool RequiresReauth { get; set; }
    public TimeSpan SessionAge { get; set; }
    public TimeSpan LastActivityAge { get; set; }
    public DateTime ValidatedAt { get; set; }
}

public class StepUpAuthResult
{
    public string UserId { get; set; } = string.Empty;
    public PrivilegeAction Action { get; set; }
    public bool IsRequired { get; set; }
    public AuthLevel RequiredAuthLevel { get; set; }
    public string? ChallengeToken { get; set; }
    public DateTime RequiredAt { get; set; }
    public DateTime? ValidUntil { get; set; }
}

public enum PrivilegeAction
{
    ViewData,
    CreateData,
    ModifyData,
    DeleteData,
    ExportData,
    ModifyPermissions,
    FinancialApproval,
    SystemConfiguration,
    BulkOperations
}

public enum AuthLevel
{
    None,
    ReenterPassword,
    MFA,
    MFAWithPin,
    MFAWithApproval
}

public class ApiRequestContext
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public long ResponseTimeMs { get; set; }
    public int StatusCode { get; set; }
}

public class ApiRequestLog
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public long ResponseTime { get; set; }
    public int StatusCode { get; set; }
}

public class BehavioralAnalysisResult
{
    public string UserId { get; set; } = string.Empty;
    public bool IsAnomaly { get; set; }
    public BehavioralAnomalyType AnomalyType { get; set; }
    public double RiskScore { get; set; }
    public string? Details { get; set; }
    public DateTime AnalyzedAt { get; set; }
    public List<string> Flags { get; set; } = new();
}

public enum BehavioralAnomalyType
{
    None,
    HighRequestRate,
    SensitiveEndpointAbuse,
    EnumerationAttempt,
    UnusualPattern,
    DataExfiltration
}

public class SecurityIncident
{
    public string Id { get; set; } = string.Empty;
    public IncidentType Type { get; set; }
    public string? UserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public IncidentSeverity Severity { get; set; }
    public string? IpAddress { get; set; }
    public bool IsResolved { get; set; }
}

public enum IncidentType
{
    ImpossibleTravel,
    SessionHijackAttempt,
    TokenReplayAttempt,
    CredentialStuffing,
    EnumerationAttack,
    BruteForce,
    PrivilegeEscalation,
    DataExfiltration,
    SuspiciousActivity
}

public enum IncidentSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public class SecurityEvent
{
    public string EventType { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string Details { get; set; } = string.Empty;
    public SecuritySeverity Severity { get; set; }
    public string? IpAddress { get; set; }
}

public class ZeroTrustDashboard
{
    public DateTime GeneratedAt { get; set; }
    public int ActiveSessions { get; set; }
    public int RegisteredDevices { get; set; }
    public int TotalIncidents24h { get; set; }
    public int CriticalIncidents { get; set; }
    public int HighIncidents { get; set; }
    public int ImpossibleTravelDetections { get; set; }
    public int SessionHijackAttempts { get; set; }
    public int TokenReplayAttempts { get; set; }
    public int EnumerationAttempts { get; set; }
    public double OverallTrustScore { get; set; }
    public List<SecurityIncident> RecentIncidents { get; set; } = new();
}

#endregion
