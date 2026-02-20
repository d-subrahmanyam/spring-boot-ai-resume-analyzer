package io.subbu.ai.firedrill.services;

import io.subbu.ai.firedrill.config.SecurityUtils;
import io.subbu.ai.firedrill.entities.Candidate;
import io.subbu.ai.firedrill.entities.CandidateMatch;
import io.subbu.ai.firedrill.entities.JobRequirement;
import io.subbu.ai.firedrill.entities.MatchAudit;
import io.subbu.ai.firedrill.models.CandidateMatchRequest;
import io.subbu.ai.firedrill.models.CandidateMatchResponse;
import io.subbu.ai.firedrill.repos.CandidateMatchRepository;
import io.subbu.ai.firedrill.repos.CandidateRepository;
import io.subbu.ai.firedrill.repos.JobRequirementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for matching candidates against job requirements using AI.
 * Generates matching scores and stores results in the database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateMatchingService {

    private final CandidateRepository candidateRepository;
    private final JobRequirementRepository jobRequirementRepository;
    private final CandidateMatchRepository matchRepository;
    private final AIService aiService;
    private final MatchAuditService matchAuditService;
    private final CandidateProfileEnrichmentService enrichmentService;

    /**
     * Match a single candidate against a job requirement.
     * 
     * @param candidateId Candidate UUID
     * @param jobRequirementId Job requirement UUID
     * @return Created or updated candidate match
     */
    @Transactional
    public CandidateMatch matchCandidateToJob(UUID candidateId, UUID jobRequirementId) {
        log.info("Matching candidate {} to job {}", candidateId, jobRequirementId);

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        JobRequirement job = jobRequirementRepository.findById(jobRequirementId)
                .orElseThrow(() -> new IllegalArgumentException("Job requirement not found: " + jobRequirementId));

        // Check if match already exists
        return matchRepository.findByCandidateIdAndJobRequirementId(candidateId, jobRequirementId)
                .map(existingMatch -> updateMatch(existingMatch, candidate, job))
                .orElseGet(() -> createNewMatch(candidate, job));
    }

    /**
     * Match all candidates against a specific job requirement.
     * 
     * @param jobRequirementId Job requirement UUID
     * @return List of candidate matches
     */
    @Transactional
    public List<CandidateMatch> matchAllCandidatesToJob(UUID jobRequirementId) {
        log.info("Matching all candidates to job {}", jobRequirementId);

        JobRequirement job = jobRequirementRepository.findById(jobRequirementId)
                .orElseThrow(() -> new IllegalArgumentException("Job requirement not found: " + jobRequirementId));

        String initiatedBy = SecurityUtils.getCurrentUsername().orElse("system");
        MatchAudit audit = matchAuditService.createAudit(jobRequirementId, job.getTitle(), initiatedBy);
        long startTime = System.currentTimeMillis();

        List<Candidate> allCandidates = candidateRepository.findAll();
        List<CandidateMatch> matches = new ArrayList<>();

        try {
            for (Candidate candidate : allCandidates) {
                try {
                    CandidateMatch match = matchRepository.findByCandidateIdAndJobRequirementId(
                            candidate.getId(), jobRequirementId)
                            .map(existingMatch -> updateMatch(existingMatch, candidate, job))
                            .orElseGet(() -> createNewMatch(candidate, job));
                    matches.add(match);
                } catch (Exception e) {
                    log.error("Error matching candidate {} to job {}",
                             candidate.getId(), jobRequirementId, e);
                }
            }

            log.info("Matched {} candidates to job {}", matches.size(), jobRequirementId);
            long durationMs = System.currentTimeMillis() - startTime;
            matchAuditService.completeAudit(audit.getId(), matches, durationMs);
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - startTime;
            matchAuditService.failAudit(audit.getId(), e.getMessage(), durationMs);
            throw e;
        }

        return matches;
    }

    /**
     * Match a single candidate against all active job requirements.
     * 
     * @param candidateId Candidate UUID
     * @return List of candidate matches
     */
    @Transactional
    public List<CandidateMatch> matchCandidateToAllJobs(UUID candidateId) {
        log.info("Matching candidate {} to all active jobs", candidateId);

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        List<JobRequirement> activeJobs = jobRequirementRepository.findByIsActive(true);
        List<CandidateMatch> matches = new ArrayList<>();

        for (JobRequirement job : activeJobs) {
            try {
                CandidateMatch match = matchRepository.findByCandidateIdAndJobRequirementId(
                        candidateId, job.getId())
                        .map(existingMatch -> updateMatch(existingMatch, candidate, job))
                        .orElseGet(() -> createNewMatch(candidate, job));
                matches.add(match);
            } catch (Exception e) {
                log.error("Error matching candidate {} to job {}", 
                         candidateId, job.getId(), e);
            }
        }

        log.info("Matched candidate {} to {} jobs", candidateId, matches.size());
        return matches;
    }

    /**
     * Create a new candidate match using AI.
     * 
     * @param candidate Candidate entity
     * @param job Job requirement entity
     * @return Created candidate match
     */
    private CandidateMatch createNewMatch(Candidate candidate, JobRequirement job) {
        CandidateMatchResponse matchResponse = performAIMatching(candidate, job);

        CandidateMatch match = CandidateMatch.builder()
                .candidate(candidate)
                .jobRequirement(job)
                .matchScore(matchResponse.getMatchScore())
                .skillsScore(matchResponse.getSkillsScore())
                .experienceScore(matchResponse.getExperienceScore())
                .educationScore(matchResponse.getEducationScore())
                .domainScore(matchResponse.getDomainScore())
                .matchExplanation(buildExplanation(matchResponse))
                .isSelected(false)
                .isShortlisted(matchResponse.getMatchScore() >= 70.0)
                .build();

        return matchRepository.save(match);
    }

    /**
     * Update an existing candidate match with fresh AI analysis.
     * 
     * @param existingMatch Existing match entity
     * @param candidate Candidate entity
     * @param job Job requirement entity
     * @return Updated candidate match
     */
    private CandidateMatch updateMatch(CandidateMatch existingMatch, Candidate candidate, JobRequirement job) {
        CandidateMatchResponse matchResponse = performAIMatching(candidate, job);

        existingMatch.setMatchScore(matchResponse.getMatchScore());
        existingMatch.setSkillsScore(matchResponse.getSkillsScore());
        existingMatch.setExperienceScore(matchResponse.getExperienceScore());
        existingMatch.setEducationScore(matchResponse.getEducationScore());
        existingMatch.setDomainScore(matchResponse.getDomainScore());
        existingMatch.setMatchExplanation(buildExplanation(matchResponse));

        // Auto-shortlist if score is high
        if (matchResponse.getMatchScore() >= 70.0 && !existingMatch.getIsSelected()) {
            existingMatch.setIsShortlisted(true);
        }

        return matchRepository.save(existingMatch);
    }

    /**
     * Perform AI-based matching between candidate and job.
     * 
     * @param candidate Candidate entity
     * @param job Job requirement entity
     * @return AI matching response
     */
    private CandidateMatchResponse performAIMatching(Candidate candidate, JobRequirement job) {
        // Include enriched profile context if available
        String enrichedContext = null;
        try {
            enrichedContext = enrichmentService.buildEnrichmentContext(candidate.getId());
        } catch (Exception e) {
            log.warn("Could not load enrichment context for candidate {}: {}", candidate.getId(), e.getMessage());
        }

        CandidateMatchRequest matchRequest = CandidateMatchRequest.builder()
                .experienceSummary(candidate.getExperienceSummary())
                .skills(candidate.getSkills())
                .domainKnowledge(candidate.getDomainKnowledge())
                .academicBackground(candidate.getAcademicBackground())
                .yearsOfExperience(candidate.getYearsOfExperience())
                .jobTitle(job.getTitle())
                .jobDescription(job.getDescription())
                .requiredSkills(job.getRequiredSkills())
                .requiredEducation(job.getRequiredEducation())
                .domainRequirements(job.getDomainRequirements())
                .minExperienceYears(job.getMinExperienceYears())
                .maxExperienceYears(job.getMaxExperienceYears())
                .enrichedProfileContext(enrichedContext)
                .build();

        return aiService.matchCandidate(matchRequest);
    }

    /**
     * Build a comprehensive explanation from AI match response.
     * 
     * @param response AI matching response
     * @return Formatted explanation text
     */
    private String buildExplanation(CandidateMatchResponse response) {
        return String.format("""
                Recommendation: %s
                
                %s
                
                Strengths:
                %s
                
                Gaps:
                %s
                """,
                response.getRecommendation(),
                response.getExplanation(),
                response.getStrengths(),
                response.getGaps()
        );
    }
}
