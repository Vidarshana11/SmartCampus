package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Member 4: OAuth Controller
 * Handles OAuth2-related operations and token management
 */
@RestController
@RequestMapping("/api/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final JwtService jwtService;

    /**
     * GET /api/oauth/user-info - Get OAuth2 user info
     * Member 4: GET endpoint for OAuth user details
     */
    @GetMapping("/user-info")
    public ResponseEntity<?> getOAuthUserInfo(OAuth2AuthenticationToken authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated with OAuth2"));
        }

        OAuth2User oAuth2User = authentication.getPrincipal();
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", oAuth2User.getAttribute("email"));
        userInfo.put("name", oAuth2User.getAttribute("name"));
        userInfo.put("picture", oAuth2User.getAttribute("picture"));
        userInfo.put("provider", authentication.getAuthorizedClientRegistrationId());

        return ResponseEntity.ok(userInfo);
    }

    /**
     * POST /api/oauth/refresh - Refresh JWT token for OAuth users
     * Member 4: POST endpoint for token refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String newToken = jwtService.generateToken(user);
        return ResponseEntity.ok(Map.of(
                "token", newToken,
                "message", "Token refreshed successfully"
        ));
    }

    /**
     * GET /api/oauth/providers - Get available OAuth2 providers
     * Member 4: GET endpoint for OAuth providers
     */
    @GetMapping("/providers")
    public ResponseEntity<Map<String, Object>> getProviders() {
        Map<String, Object> providers = new HashMap<>();
        providers.put("google", Map.of(
                "name", "Google",
                "authorizationEndpoint", "/oauth2/authorization/google",
                "scopes", new String[]{"profile", "email"}
        ));

        return ResponseEntity.ok(Map.of("providers", providers));
    }

    /**
     * GET /api/oauth/token-info - Get current token info
     * Member 4: GET endpoint for token inspection
     */
    @GetMapping("/token-info")
    public ResponseEntity<?> getTokenInfo(@AuthenticationPrincipal User user,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("userId", user.getId());
        tokenInfo.put("email", user.getEmail());
        tokenInfo.put("role", user.getRole().name());
        tokenInfo.put("hasToken", token != null);

        if (token != null) {
            try {
                tokenInfo.put("expiration", jwtService.extractExpiration(token));
            } catch (Exception e) {
                tokenInfo.put("expiration", "invalid");
            }
        }

        return ResponseEntity.ok(tokenInfo);
    }
}
