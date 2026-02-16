package io.subbu.ai.firedrill.services;

import io.subbu.ai.firedrill.entities.ProcessTracker;
import io.subbu.ai.firedrill.models.ProcessStatus;
import io.subbu.ai.firedrill.repos.ProcessTrackerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service for handling file uploads.
 * Validates files, saves temporarily, and initiates async processing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final FileParserService fileParserService;
    private final ResumeProcessingService resumeProcessingService;
    private final ProcessTrackerRepository trackerRepository;

    @Value("${app.upload.directory:./uploads}")
    private String uploadDirectory;

    @Value("${app.upload.allowed-extensions:.doc,.docx,.pdf}")
    private String allowedExtensions;

    /**
     * Handle single or ZIP file upload.
     * Creates a process tracker and initiates async processing.
     * 
     * @param file Uploaded file
     * @return UUID of the process tracker
     * @throws IOException if file operations fail
     */
    @Transactional
    public UUID handleFileUpload(MultipartFile file) throws IOException {
        log.info("Handling file upload: {}", file.getOriginalFilename());

        // Validate file
        validateFile(file);

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Create process tracker
        ProcessTracker tracker = ProcessTracker.builder()
                .status(ProcessStatus.INITIATED)
                .uploadedFilename(file.getOriginalFilename())
                .totalFiles(1)
                .processedFiles(0)
                .failedFiles(0)
                .message("Upload received, processing initiated")
                .build();

        tracker = trackerRepository.save(tracker);
        log.info("Created process tracker: {}", tracker.getId());

        // Read file data
        byte[] fileData = file.getBytes();

        // Determine if ZIP or single file
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".zip")) {
            // Process ZIP file asynchronously
            resumeProcessingService.processZipFile(fileData, filename, tracker.getId());
        } else {
            // Process single resume asynchronously
            resumeProcessingService.processSingleResume(fileData, filename, tracker.getId());
        }

        return tracker.getId();
    }

    /**
     * Validate uploaded file.
     * Checks file size, extension, and content.
     * 
     * @param file Uploaded file
     * @throws IllegalArgumentException if validation fails
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename is required");
        }

        // Check if ZIP or allowed resume format
        boolean isZip = filename.toLowerCase().endsWith(".zip");
        boolean isValidFormat = fileParserService.isValidFileFormat(filename);

        if (!isZip && !isValidFormat) {
            throw new IllegalArgumentException(
                "Unsupported file format. Allowed formats: " + allowedExtensions + ", .zip"
            );
        }

        // Check file size (already handled by Spring Boot multipart config, 
        // but we can add custom validation here)
        long maxSize = 50 * 1024 * 1024; // 50 MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                "File size exceeds maximum allowed size of 50 MB"
            );
        }

        log.debug("File validation passed: {}", filename);
    }

    /**
     * Get process tracker by ID.
     * 
     * @param trackerId Tracker UUID
     * @return Process tracker
     */
    public ProcessTracker getProcessStatus(UUID trackerId) {
        return trackerRepository.findById(trackerId)
                .orElseThrow(() -> new IllegalArgumentException("Tracker not found: " + trackerId));
    }
}
