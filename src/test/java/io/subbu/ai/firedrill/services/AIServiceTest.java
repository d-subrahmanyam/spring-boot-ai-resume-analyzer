package io.subbu.ai.firedrill.services;

import io.subbu.ai.firedrill.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClient.CallResponseSpec;
import org.springframework.ai.chat.client.ChatClient.PromptUserSpec;
import org.springframework.ai.chat.model.ChatModel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AIService.
 * Tests resume analysis and candidate matching with mocked LLM responses.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AIService Unit Tests")
class AIServiceTest {

    @Mock
    private ChatModel chatModel;

    @InjectMocks
    private AIService aiService;

    private String sampleResumeContent;
    private ResumeAnalysisRequest resumeAnalysisRequest;
    private CandidateMatchRequest candidateMatchRequest;

    @BeforeEach
    void setUp() {
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
    @DisplayName("Should handle ChatModel exceptions gracefully")
    void shouldHandleChatModelExceptions() {
        // Given
        when(chatModel.call((org.springframework.ai.chat.prompt.Prompt) any()))
                .thenThrow(new RuntimeException("LLM service unavailable"));

        // When/Then
        org.junit.jupiter.api.Assertions.assertThrows(RuntimeException.class, () -> {
            aiService.analyzeResume(resumeAnalysisRequest);
        });

        verify(chatModel, times(1)).call((org.springframework.ai.chat.prompt.Prompt) any());
    }
}
