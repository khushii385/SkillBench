package com.skillbench.project.config;

import com.skillbench.project.security.JwtAuthenticationFilter;
import com.skillbench.project.security.JwtProvider;
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
                        .requestMatchers(HttpMethod.POST, "/api/projects").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/projects/*").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/projects/*").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/projects/*/complete").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/projects/submissions/*/review").hasRole("CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/projects/*/accept").hasRole("VENDOR_DEVELOPER")
                        .requestMatchers(HttpMethod.POST, "/api/projects/*/submissions").hasRole("VENDOR_DEVELOPER")
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