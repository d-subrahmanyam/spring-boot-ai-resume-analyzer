package io.subbu.ai.firedrill.resolver;

import io.subbu.ai.firedrill.entities.CandidateMatch;
import io.subbu.ai.firedrill.repos.CandidateMatchRepository;
import io.subbu.ai.firedrill.services.CandidateMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

/**
 * GraphQL resolver for CandidateMatch queries and mutations.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class CandidateMatchResolver {

    private final CandidateMatchRepository matchRepository;
    private final CandidateMatchingService matchingService;

    @QueryMapping
    public List<CandidateMatch> matchesForJob(@Argument UUID jobId, @Argument Integer limit) {
        log.info("Fetching matches for job: {}", jobId);
        if (limit == null) limit = 10;
        return matchRepository.topMatchesForJob(jobId, limit);
    }

    @QueryMapping
    public List<CandidateMatch> matchesByCandidate(@Argument UUID candidateId) {
        log.info("Fetching matches for candidate: {}", candidateId);
        return matchRepository.findByCandidateId(candidateId);
    }

    @QueryMapping
    public List<CandidateMatch> shortlistedCandidates(@Argument UUID jobId) {
        log.info("Fetching shortlisted candidates for job: {}", jobId);
        return matchRepository.findByJobRequirementIdAndIsShortlisted(jobId, true);
    }

    @QueryMapping
    public List<CandidateMatch> selectedCandidates(@Argument UUID jobId) {
        log.info("Fetching selected candidates for job: {}", jobId);
        return matchRepository.findByJobRequirementIdAndIsSelected(jobId, true);
    }

    @MutationMapping
    public CandidateMatch matchCandidateToJob(@Argument UUID candidateId, @Argument UUID jobId) {
        log.info("Matching candidate {} to job {}", candidateId, jobId);
        return matchingService.matchCandidateToJob(candidateId, jobId);
    }

    @MutationMapping
    public List<CandidateMatch> matchAllCandidatesToJob(@Argument UUID jobId) {
        log.info("Matching all candidates to job: {}", jobId);
        return matchingService.matchAllCandidatesToJob(jobId);
    }

    @MutationMapping
    public List<CandidateMatch> matchCandidateToAllJobs(@Argument UUID candidateId) {
        log.info("Matching candidate to all jobs: {}", candidateId);
        return matchingService.matchCandidateToAllJobs(candidateId);
    }

    @MutationMapping
    public CandidateMatch updateMatchStatus(
            @Argument UUID matchId,
            @Argument Boolean isShortlisted,
            @Argument Boolean isSelected) {
        
        log.info("Updating match status: {}", matchId);
        CandidateMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        if (isShortlisted != null) match.setIsShortlisted(isShortlisted);
        if (isSelected != null) match.setIsSelected(isSelected);

        return matchRepository.save(match);
    }
}
