package io.subbu.ai.firedrill.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.subbu.ai.firedrill.entities.Candidate;
import io.subbu.ai.firedrill.entities.CandidateExternalProfile;
import io.subbu.ai.firedrill.entities.ExternalProfileSource;
import io.subbu.ai.firedrill.repos.CandidateExternalProfileRepository;
import io.subbu.ai.firedrill.repos.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for fetching and storing candidate profile information from external
 * sources such as GitHub. The enriched data is later used to augment candidate
 * matching context for more accurate AI-based scoring.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileEnrichmentService {

    private static final String GITHUB_API_BASE = "https://api.github.com";
    private static final String USER_AGENT = "ResumeAnalyzer/1.0";

    private final CandidateExternalProfileRepository externalProfileRepository;
    private final CandidateRepository candidateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Get all external profiles for a candidate.
     *
     * @param candidateId Candidate UUID
     * @return list of external profiles
     */
    public List<CandidateExternalProfile> getExternalProfiles(UUID candidateId) {
        return externalProfileRepository.findByCandidateId(candidateId);
    }

    /**
     * Enrich a candidate's profile from the specified source.
     * If a profile for this source already exists, it is refreshed.
     *
     * @param candidateId Candidate UUID
     * @param source      External source to fetch from
     * @return the upserted CandidateExternalProfile
     */
    @Transactional
    public CandidateExternalProfile enrichProfile(UUID candidateId, ExternalProfileSource source) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        CandidateExternalProfile profile = externalProfileRepository
                .findByCandidateIdAndSource(candidateId, source)
                .orElseGet(() -> CandidateExternalProfile.builder()
                        .candidate(candidate)
                        .source(source)
                        .status("PENDING")
                        .build());

        return switch (source) {
            case GITHUB -> enrichFromGitHub(profile, candidate);
            case LINKEDIN -> enrichFromLinkedInWeb(profile, candidate);
            case INTERNET_SEARCH -> enrichFromInternetSearch(profile, candidate);
        };
    }

    /**
     * Refresh an existing external profile by ID.
     *
     * @param profileId External profile UUID
     * @return refreshed profile
     */
    @Transactional
    public CandidateExternalProfile refreshProfile(UUID profileId) {
        CandidateExternalProfile profile = externalProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + profileId));

        Candidate candidate = profile.getCandidate();
        return switch (profile.getSource()) {
            case GITHUB -> enrichFromGitHub(profile, candidate);
            case LINKEDIN -> enrichFromLinkedInWeb(profile, candidate);
            case INTERNET_SEARCH -> enrichFromInternetSearch(profile, candidate);
        };
    }

    /**
     * Build an enrichment context string for use in candidate matching.
     * Aggregates all successful external profiles for a candidate.
     *
     * @param candidateId Candidate UUID
     * @return formatted enrichment context, or null if no profiles
     */
    public String buildEnrichmentContext(UUID candidateId) {
        List<CandidateExternalProfile> profiles = externalProfileRepository
                .findByCandidateIdAndStatus(candidateId, "SUCCESS");

        if (profiles.isEmpty()) {
            return null;
        }

        StringBuilder sb = new StringBuilder("--- External Profile Information ---\n");
        for (CandidateExternalProfile p : profiles) {
            sb.append(String.format("[Source: %s]\n", p.getSource().name()));
            if (p.getProfileUrl() != null) {
                sb.append(String.format("Profile URL: %s\n", p.getProfileUrl()));
            }
            if (p.getBio() != null && !p.getBio().isBlank()) {
                sb.append(String.format("Bio: %s\n", p.getBio()));
            }
            if (p.getCompany() != null) {
                sb.append(String.format("Company: %s\n", p.getCompany()));
            }
            if (p.getLocation() != null) {
                sb.append(String.format("Location: %s\n", p.getLocation()));
            }
            if (p.getPublicRepos() != null) {
                sb.append(String.format("Public Repos: %d\n", p.getPublicRepos()));
            }
            if (p.getEnrichedSummary() != null && !p.getEnrichedSummary().isBlank()) {
                sb.append(String.format("Additional Info: %s\n", p.getEnrichedSummary()));
            }
            if (p.getRepositories() != null && !p.getRepositories().isBlank()) {
                sb.append(String.format("Notable Projects: %s\n", p.getRepositories()));
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private CandidateExternalProfile enrichFromGitHub(CandidateExternalProfile profile, Candidate candidate) {
        log.info("Enriching GitHub profile for candidate: {}", candidate.getName());
        try {
            // 1. Search GitHub users by name
            String searchName = buildSearchName(candidate);
            String searchUrl = UriComponentsBuilder.fromHttpUrl(GITHUB_API_BASE + "/search/users")
                    .queryParam("q", searchName + " in:name")
                    .queryParam("per_page", 3)
                    .build()
                    .toUriString();

            JsonNode searchResult = callGitHubApi(searchUrl);
            if (searchResult == null) {
                return saveFailedProfile(profile, "GitHub API returned no response");
            }

            JsonNode items = searchResult.path("items");
            if (!items.isArray() || items.isEmpty()) {
                log.info("No GitHub user found for candidate: {}", candidate.getName());
                return saveNotFoundProfile(profile);
            }

            // 2. Get the best-matched user's login
            String login = items.get(0).path("login").asText();
            if (login.isBlank()) {
                return saveNotFoundProfile(profile);
            }

            // 3. Fetch detailed user profile
            JsonNode userProfile = callGitHubApi(GITHUB_API_BASE + "/users/" + login);
            if (userProfile == null) {
                return saveNotFoundProfile(profile);
            }

            profile.setProfileUrl("https://github.com/" + login);
            profile.setDisplayName(nullIfEmpty(userProfile.path("name").asText()));
            profile.setBio(nullIfEmpty(userProfile.path("bio").asText()));
            profile.setLocation(nullIfEmpty(userProfile.path("location").asText()));
            profile.setCompany(nullIfEmpty(userProfile.path("company").asText()));
            profile.setPublicRepos(userProfile.path("public_repos").asInt(0));
            profile.setFollowers(userProfile.path("followers").asInt(0));

            // 4. Fetch top repositories
            JsonNode repos = callGitHubApi(GITHUB_API_BASE + "/users/" + login + "/repos?sort=stars&per_page=5");
            List<String> repoNames = new ArrayList<>();
            if (repos != null && repos.isArray()) {
                for (JsonNode repo : repos) {
                    String repoName = repo.path("name").asText();
                    String repoDescription = repo.path("description").asText();
                    int stars = repo.path("stargazers_count").asInt(0);
                    String repoLang = repo.path("language").asText("unknown");
                    if (!repoName.isBlank()) {
                        repoNames.add(String.format("%s (%s, %d stars): %s", repoName, repoLang, stars, repoDescription));
                    }
                }
            }
            if (!repoNames.isEmpty()) {
                profile.setRepositories(String.join("; ", repoNames));
            }

            // 5. Build an enriched summary
            profile.setEnrichedSummary(buildGitHubSummary(login, userProfile, repoNames));
            profile.setStatus("SUCCESS");
            profile.setLastFetchedAt(LocalDateTime.now());
            profile.setErrorMessage(null);

            log.info("Successfully enriched GitHub profile for candidate: {} (login: {})", candidate.getName(), login);
            return externalProfileRepository.save(profile);

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("GitHub API rate limit exceeded for candidate: {}", candidate.getName());
            return saveFailedProfile(profile, "GitHub API rate limit exceeded — try again later.");
        } catch (Exception e) {
            log.error("Error enriching GitHub profile for candidate {}: {}", candidate.getName(), e.getMessage());
            return saveFailedProfile(profile, e.getMessage());
        }
    }

    private CandidateExternalProfile enrichFromLinkedInWeb(CandidateExternalProfile profile, Candidate candidate) {
        // LinkedIn API requires OAuth 2.0 and is not publicly accessible.
        // We store a placeholder indicating the source is available for future integration.
        log.info("LinkedIn enrichment is not available without OAuth — storing placeholder for: {}", candidate.getName());
        profile.setStatus("NOT_AVAILABLE");
        profile.setErrorMessage("LinkedIn integration requires OAuth 2.0. Feature planned for future release.");
        profile.setLastFetchedAt(LocalDateTime.now());
        return externalProfileRepository.save(profile);
    }

    private CandidateExternalProfile enrichFromInternetSearch(CandidateExternalProfile profile, Candidate candidate) {
        // Internet search can be implemented via Tavily/SerpAPI etc.
        // For now, build a search-intent context from the candidate's existing data.
        log.info("Building internet search context for candidate: {}", candidate.getName());
        try {
            String summary = buildInternetSearchSummary(candidate);
            profile.setStatus("SUCCESS");
            profile.setEnrichedSummary(summary);
            profile.setDisplayName(candidate.getName());
            profile.setLastFetchedAt(LocalDateTime.now());
            profile.setErrorMessage(null);
            return externalProfileRepository.save(profile);
        } catch (Exception e) {
            return saveFailedProfile(profile, e.getMessage());
        }
    }

    private CandidateExternalProfile saveFailedProfile(CandidateExternalProfile profile, String errorMessage) {
        profile.setStatus("FAILED");
        profile.setErrorMessage(errorMessage);
        profile.setLastFetchedAt(LocalDateTime.now());
        return externalProfileRepository.save(profile);
    }

    private CandidateExternalProfile saveNotFoundProfile(CandidateExternalProfile profile) {
        profile.setStatus("NOT_FOUND");
        profile.setLastFetchedAt(LocalDateTime.now());
        return externalProfileRepository.save(profile);
    }

    private JsonNode callGitHubApi(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/vnd.github.v3+json");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.readTree(response.getBody());
            }
        } catch (Exception e) {
            log.warn("GitHub API call failed for {}: {}", url, e.getMessage());
        }
        return null;
    }

    /**
     * Build a search name from candidate fields — try name + company if available.
     */
    private String buildSearchName(Candidate candidate) {
        String name = Optional.ofNullable(candidate.getName()).orElse("").trim();
        // Use first + last name only to broaden search
        String[] parts = name.split("\\s+");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[parts.length - 1];
        }
        return name;
    }

    private String buildGitHubSummary(String login, JsonNode userProfile, List<String> repoNames) {
        StringBuilder sb = new StringBuilder();
        int publicRepos = userProfile.path("public_repos").asInt(0);
        int followers = userProfile.path("followers").asInt(0);
        sb.append(String.format("GitHub username: %s. %d public repositories, %d followers. ", login, publicRepos, followers));

        String blog = nullIfEmpty(userProfile.path("blog").asText());
        if (blog != null) {
            sb.append(String.format("Blog/website: %s. ", blog));
        }

        if (!repoNames.isEmpty()) {
            sb.append("Top projects: ").append(String.join(", ", repoNames)).append(".");
        }
        return sb.toString();
    }

    private String buildInternetSearchSummary(Candidate candidate) {
        // Build a structured text representing what internet search would yield
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Candidate: %s. ", candidate.getName()));
        if (candidate.getEmail() != null) {
            sb.append(String.format("Contact: %s. ", candidate.getEmail()));
        }
        if (candidate.getCurrentCompany() != null) {
            sb.append(String.format("Currently at: %s. ", candidate.getCurrentCompany()));
        }
        if (candidate.getSkills() != null) {
            sb.append(String.format("Skills: %s. ", candidate.getSkills()));
        }
        sb.append("(Enriched from resume data — external web search integration available via Tavily API in future.)");
        return sb.toString();
    }

    private String nullIfEmpty(String value) {
        return (value == null || value.isBlank() || "null".equals(value)) ? null : value;
    }
}
