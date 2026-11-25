package com.skillbench.escrow.config;

import com.skillbench.escrow.security.JwtAuthenticationFilter;
import com.skillbench.escrow.security.JwtProvider;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    public SecurityConfig(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Paisa sirf CLIENT_ADMIN hi hilaa sakta hai
                        .requestMatchers(HttpMethod.POST, "/api/escrows").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/escrows/project/*/release").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/escrows/project/*/refund").hasRole("CLIENT_ADMIN")
                        // Dekhne ke liye login kaafi hai (aage service mein ownership check hota hai)
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                writeError(res, 401, "Authentication required or token expired"))
                        .accessDeniedHandler((req, res, ex) ->
                                writeError(res, 403, "You do not have permission to perform this action")))
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeError(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
    }
}