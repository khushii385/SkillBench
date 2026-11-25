package com.skillbench.escrow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtProvider {

    private final SecretKey key;

    public JwtProvider(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Token galat ya expire ho to JwtException throw hoti hai */
    public AuthUser parse(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        // JJWT chhote numbers ko Integer banata hai, isliye Number.class se padhna zaroori hai
        Number userId = claims.get("userId", Number.class);
        String role = claims.get("role", String.class);

        if (userId == null || role == null) {
            throw new JwtException("Token is missing userId or role");
        }
        return new AuthUser(userId.longValue(), claims.getSubject(), role, token);
    }
}