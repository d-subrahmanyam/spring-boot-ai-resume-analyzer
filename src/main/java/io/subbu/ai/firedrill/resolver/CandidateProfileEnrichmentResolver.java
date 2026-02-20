package io.subbu.ai.firedrill.resolver;

import io.subbu.ai.firedrill.entities.CandidateExternalProfile;
import io.subbu.ai.firedrill.entities.ExternalProfileSource;
import io.subbu.ai.firedrill.services.CandidateProfileEnrichmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

/**
 * GraphQL resolver for candidate external profile enrichment.
 * Provides queries to read enriched profiles and mutations to trigger/refresh enrichment.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileEnrichmentResolver {

    private final CandidateProfileEnrichmentService enrichmentService;

    /**
     * Fetch all external profiles for a given candidate.
     */
    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'HR')")
    public List<CandidateExternalProfile> candidateExternalProfiles(@Argument UUID candidateId) {
        log.info("Fetching external profiles for candidate: {}", candidateId);
        return enrichmentService.getExternalProfiles(candidateId);
    }

    /**
     * Trigger enrichment from a specific source for a candidate.
     * If a profile for that source already exists, it is refreshed.
     */
    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public CandidateExternalProfile enrichCandidateProfile(
            @Argument UUID candidateId,
            @Argument ExternalProfileSource source) {
        log.info("Enriching profile for candidate {} from source {}", candidateId, source);
        return enrichmentService.enrichProfile(candidateId, source);
    }

    /**
     * Refresh an existing external profile by its own ID.
     */
    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public CandidateExternalProfile refreshCandidateProfile(@Argument UUID profileId) {
        log.info("Refreshing external profile: {}", profileId);
        return enrichmentService.refreshProfile(profileId);
    }
}
