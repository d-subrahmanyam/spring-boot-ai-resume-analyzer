package io.subbu.ai.firedrill.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.subbu.ai.firedrill.models.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Service for AI/LLM interactions using direct HTTP calls to the LLM Studio API.
 * Bypasses Spring AI ChatClient to avoid compatibility issues with local LLM servers.
 */
@Service
@Slf4j
public class AIService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.ai.openai.base-url:http://localhost:1234/v1}")
    private String llmBaseUrl;

    @Value("${spring.ai.openai.chat.options.model:mistralai/mistral-7b-instruct-v0.3}")
    private String chatModel;

    /**
     * Call the LLM API directly via HTTP.
     */
    private String callLlm(String prompt) {
        try {
            String url = llmBaseUrl + "/chat/completions";
            
            Map<String, Object> requestBody = Map.of(
                "model", chatModel,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 3000,
                "temperature", 0.3
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode content = choices.get(0).path("message").path("content");
                    if (!content.isMissingNode() && !content.isNull()) {
                        return content.asText();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error calling LLM API: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Analyze resume content using AI to extract candidate information.
     * 
     * @param request Resume analysis request
     * @return Analysis response with extracted information
     */
    public ResumeAnalysisResponse analyzeResume(ResumeAnalysisRequest request) {
        log.info("Analyzing resume: {}", request.getFilename());

        String prompt = buildResumeAnalysisPrompt(request.getResumeContent());
        String response = callLlm(prompt);
        log.info("AI Response length: {}", response != null ? response.length() : "null");

        return parseResumeAnalysisResponse(response);
    }

    /**
     * Generate matching scores between a candidate and job requirement using AI.
     * 
     * @param request Candidate match request
     * @return Match response with scores and explanations
     */
    public CandidateMatchResponse matchCandidate(CandidateMatchRequest request) {
        log.info("Matching candidate for job: {}", request.getJobTitle());

        String prompt = buildMatchingPrompt(request);
        String response = callLlm(prompt);
        log.debug("AI Matching Response: {}", response);

        return parseMatchingResponse(response);
    }

    /**
     * Build prompt for resume analysis.
     * 
     * @param resumeContent Resume text
     * @return Formatted prompt
     */
    private String buildResumeAnalysisPrompt(String resumeContent) {
        return String.format("""
            You are an expert HR analyst. Analyze the following resume and extract key information.
            
            Resume Content:
            %s
            
            Please provide a JSON response with the following structure:
            {
              "name": "Candidate's full name",
              "email": "Email address",
              "mobile": "Phone number",
              "experienceSummary": "Brief summary of work experience (2-3 sentences)",
              "skills": "MUST be a plain string with comma-separated values e.g. Java, Spring Boot, AWS",
              "domainKnowledge": "MUST be a plain string with comma-separated domains e.g. Fintech, Cloud",
              "academicBackground": "Education qualifications as a plain string summary",
              "yearsOfExperience": <number>,
              "confidenceScore": <0-1 decimal>
            }
            
            IMPORTANT: skills, domainKnowledge, and academicBackground MUST be plain strings, NOT JSON arrays.
            Extract information accurately. If a field is not found, use null or empty string.
            For yearsOfExperience, calculate based on employment history.
            For confidenceScore, rate your confidence in the extraction (0.0-1.0).
            
            Respond ONLY with valid JSON, no additional text.
            """, resumeContent);
    }

    /**
     * Build prompt for candidate matching.
     * 
     * @param request Match request
     * @return Formatted prompt
     */
    private String buildMatchingPrompt(CandidateMatchRequest request) {
        return String.format("""
            You are an expert recruitment analyst. Match the following candidate against the job requirement.
            
            CANDIDATE PROFILE:
            - Experience Summary: %s
            - Skills: %s
            - Domain Knowledge: %s
            - Academic Background: %s
            - Years of Experience: %d
            
            JOB REQUIREMENT:
            - Title: %s
            - Description: %s
            - Required Skills: %s
            - Required Education: %s
            - Domain Requirements: %s
            - Experience Range: %d - %d years
            
            Provide a detailed matching analysis in JSON format:
            {
              "matchScore": <0-100>,
              "skillsScore": <0-100>,
              "experienceScore": <0-100>,
              "educationScore": <0-100>,
              "domainScore": <0-100>,
              "explanation": "Overall match explanation",
              "strengths": "Key strengths of candidate for this role",
              "gaps": "Missing qualifications or skills",
              "recommendation": "Strong Match|Good Match|Partial Match|No Match"
            }
            
            Be objective and thorough. Respond ONLY with valid JSON.
            """,
            request.getExperienceSummary(),
            request.getSkills(),
            request.getDomainKnowledge(),
            request.getAcademicBackground(),
            request.getYearsOfExperience() != null ? request.getYearsOfExperience() : 0,
            request.getJobTitle(),
            request.getJobDescription(),
            request.getRequiredSkills(),
            request.getRequiredEducation(),
            request.getDomainRequirements(),
            request.getMinExperienceYears() != null ? request.getMinExperienceYears() : 0,
            request.getMaxExperienceYears() != null ? request.getMaxExperienceYears() : 100
        );
    }

    /**
     * Parse AI response for resume analysis.
     * 
     * @param aiResponse Raw AI response
     * @return Parsed analysis response
     */
    private ResumeAnalysisResponse parseResumeAnalysisResponse(String aiResponse) {
        try {
            // Extract JSON from response (sometimes AI adds extra text)
            String jsonResponse = extractJson(aiResponse);
            return objectMapper.readValue(jsonResponse, ResumeAnalysisResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", aiResponse, e);
            // Return a default response with minimal info
            return ResumeAnalysisResponse.builder()
                    .name("Unknown")
                    .email("")
                    .mobile("")
                    .experienceSummary("Resume processed (AI analysis unavailable)")
                    .skills("")
                    .domainKnowledge("")
                    .academicBackground("")
                    .yearsOfExperience(0)
                    .confidenceScore(0.0)
                    .build();
        }
    }

    /**
     * Parse AI response for matching.
     * 
     * @param aiResponse Raw AI response
     * @return Parsed matching response
     */
    private CandidateMatchResponse parseMatchingResponse(String aiResponse) {
        try {
            String jsonResponse = extractJson(aiResponse);
            return objectMapper.readValue(jsonResponse, CandidateMatchResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse matching response: {}", aiResponse, e);
            return CandidateMatchResponse.builder()
                    .matchScore(0.0)
                    .recommendation("Error in Analysis")
                    .build();
        }
    }

    /**
     * Extract JSON content from AI response.
     * Handles cases where AI adds extra text around JSON.
     * 
     * @param response AI response
     * @return Extracted JSON string
     */
    private String extractJson(String response) {
        if (response == null || response.isBlank()) {
            throw new IllegalArgumentException("AI returned null or empty response");
        }
        // Find first { and last }
        int startIndex = response.indexOf('{');
        int endIndex = response.lastIndexOf('}');

        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return response.substring(startIndex, endIndex + 1);
        }

        return response;
    }
}
