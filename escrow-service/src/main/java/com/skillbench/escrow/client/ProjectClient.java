package com.skillbench.escrow.client;

import com.skillbench.escrow.exception.ForbiddenException;
import com.skillbench.escrow.exception.InvalidStateException;
import com.skillbench.escrow.exception.ResourceNotFoundException;
import com.skillbench.escrow.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class ProjectClient {

    private final RestClient restClient;

    public ProjectClient(RestClient.Builder builder, @Value("${services.project-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(factory).build();
    }

    public ProjectInfo getProject(Long projectId, String token) {
        try {
            return restClient.get()
                    .uri("/api/projects/{id}", projectId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(ProjectInfo.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new ForbiddenException("You cannot access this project");
        } catch (RestClientException e) {
            throw new ServiceUnavailableException("Project service is not reachable. Please try again later.");
        }
    }

    public void completeProject(Long projectId, String token) {
        try {
            restClient.post()
                    .uri("/api/projects/{id}/complete", projectId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Conflict e) {
            throw new InvalidStateException(
                    "Payment cannot be released yet. The developer must submit work and you must approve it first.");
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new ForbiddenException("You cannot complete this project");
        } catch (RestClientException e) {
            throw new ServiceUnavailableException("Project service is not reachable. Please try again later.");
        }
    }
}