package io.subbu.ai.firedrill.services;

import io.subbu.ai.firedrill.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AIService.
 * AIService uses RestTemplate directly (new RestTemplate()) for HTTP calls to LLM Studio.
 * When LLM is unavailable, methods return graceful fallback responses — they do not throw.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AIService Unit Tests")
class AIServiceTest {

    @InjectMocks
    private AIService aiService;

    private String sampleResumeContent;
    private ResumeAnalysisRequest resumeAnalysisRequest;
    private CandidateMatchRequest candidateMatchRequest;

    @BeforeEach
    void setUp() {
        // Point to a non-existent host so HTTP calls fail fast (no real LLM needed)
        ReflectionTestUtils.setField(aiService, "llmBaseUrl", "http://localhost:9999/v1");
        ReflectionTestUtils.setField(aiService, "chatModel", "test-model");

        sampleResumeContent = """
            John Doe
            john.doe@email.com | (555) 123-4567
            
            EXPERIENCE
            Senior Software Engineer at Tech Corp (2019-2024)
            - Led development of microservices architecture
            - Mentored team of 5 developers
            
            SKILLS
            Java, Spring Boot, Kubernetes, PostgreSQL, React
            
            EDUCATION
            Master of Science in Computer Science, MIT, 2019
            """;

        resumeAnalysisRequest = ResumeAnalysisRequest.builder()
                .filename("john-doe-resume.pdf")
                .resumeContent(sampleResumeContent)
                .build();

        candidateMatchRequest = CandidateMatchRequest.builder()
                .experienceSummary("Senior Software Engineer with 5 years of experience in microservices")
                .skills("Java, Spring Boot, Kubernetes, PostgreSQL, React")
                .domainKnowledge("Enterprise software, Cloud architecture")
                .academicBackground("Master of Science in Computer Science, MIT")
                .yearsOfExperience(5)
                .jobTitle("Lead Software Engineer")
                .jobDescription("Looking for experienced engineer to lead microservices development")
                .requiredSkills("Java, Spring Boot, Kubernetes, Docker")
                .requiredEducation("Bachelor's or Master's in Computer Science")
                .domainRequirements("Enterprise software development")
                .minExperienceYears(4)
                .maxExperienceYears(8)
                .build();
    }

    @Test
    @DisplayName("Should return fallback response when LLM is unavailable")
    void shouldHandleLlmUnavailableGracefully() {
        // AIService catches all HTTP/IO exceptions and returns a default response.
        // When the LLM endpoint is unreachable, analyzeResume should NOT throw —
        // it should return a non-null fallback ResumeAnalysisResponse.
        ResumeAnalysisResponse result = aiService.analyzeResume(resumeAnalysisRequest);

        assertThat(result).isNotNull();
        assertThat(result.getExperienceSummary()).isNotNull();
    }

    @Test
    @DisplayName("Should return fallback match response when LLM is unavailable")
    void shouldHandleLlmUnavailableForMatchingGracefully() {
        // When LLM is unreachable, matchCandidate should NOT throw —
        // it should return a non-null fallback CandidateMatchResponse.
        CandidateMatchResponse result = aiService.matchCandidate(candidateMatchRequest);

        assertThat(result).isNotNull();
        assertThat(result.getRecommendation()).isNotNull();
    }

    @Test
    @DisplayName("Should not throw when resume content is empty")
    void shouldHandleEmptyResumeContent() {
        ResumeAnalysisRequest emptyRequest = ResumeAnalysisRequest.builder()
                .filename("empty.pdf")
                .resumeContent("")
                .build();

        // Service should handle empty content without throwing
        ResumeAnalysisResponse result = aiService.analyzeResume(emptyRequest);
        assertThat(result).isNotNull();
    }
}
