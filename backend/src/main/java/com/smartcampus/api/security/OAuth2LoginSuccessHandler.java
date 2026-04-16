package com.smartcampus.api.security;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // Check if user already exists to determine if this is a new user
        var existingUser = userRepository.findByEmail(email);
        boolean isNewUser = existingUser.isEmpty();

        User user = existingUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : email);
            newUser.setProfilePictureUrl(picture);
            newUser.setRole(Role.USER);
            newUser.setEmailVerified(true);  // OAuth emails are pre-verified
            return userRepository.save(newUser);
        });

        // Only update name if it's null (preserve user's changes)
        if (user.getName() == null && name != null) {
            user.setName(name);
            userRepository.save(user);
        }

        // Only update profile picture if it's null (preserve user's custom photo)
        if (user.getProfilePictureUrl() == null && picture != null) {
            user.setProfilePictureUrl(picture);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);

        // Redirect to React frontend with the JWT token and isNewUser flag
        String frontendRedirectUrl = "http://localhost:5173/auth/success?token=" + token + "&isNewUser=" + isNewUser;
        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUrl);
    }
}
