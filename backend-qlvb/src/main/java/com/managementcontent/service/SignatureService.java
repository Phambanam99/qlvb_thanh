package com.managementcontent.service;

import com.managementcontent.exception.SignatureStorageException;
import com.managementcontent.model.Signature;
import com.managementcontent.model.User;
import com.managementcontent.repository.SignatureRepository;
import com.managementcontent.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class SignatureService {

    private final SignatureRepository signatureRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path signatureStorageLocation;

    @Autowired
    public SignatureService(SignatureRepository signatureRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${file.signature-upload-dir:./signature-uploads}") String uploadDir) {
        this.signatureRepository = signatureRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.signatureStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.signatureStorageLocation);
        } catch (Exception ex) {
            throw new SignatureStorageException(
                    "Could not create the directory where the uploaded signatures will be stored.", ex);
        }
    }

    public List<Signature> getSignaturesForCurrentUser() {
        User currentUser = getCurrentUser();
        return signatureRepository.findByUser(currentUser);
    }

    public Signature createSignature(MultipartFile file, String password) {
        User currentUser = getCurrentUser();
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (fileName.contains("..")) {
                throw new SignatureStorageException("Sorry! Filename contains invalid path sequence " + fileName);
            }

            Path targetLocation = this.signatureStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Signature signature = Signature.builder()
                    .user(currentUser)
                    .imagePath(targetLocation.toString())
                    .fileName(fileName)
                    .password(passwordEncoder.encode(password))
                    .build();

            return signatureRepository.save(signature);

        } catch (IOException ex) {
            throw new SignatureStorageException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    // Helper method to get current authenticated user
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByName(username).orElse(null);
    }
    public void deleteSignature(Long signatureId, String password) {
        User currentUser = getCurrentUser();
        Signature signature = signatureRepository.findById(signatureId)
                .orElseThrow(() -> new RuntimeException("Signature not found"));

        if (!signature.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("User not authorized to delete this signature");
        }

        if (!passwordEncoder.matches(password, signature.getPassword())) {
            throw new BadCredentialsException("Invalid password for signature");
        }

        try {
            Path fileToDelete = this.signatureStorageLocation.resolve(signature.getFileName()).normalize();
            Files.deleteIfExists(fileToDelete);
        } catch (IOException ex) {
            throw new SignatureStorageException("Could not delete signature file. Please try again!", ex);
        }

        signatureRepository.delete(signature);
    }

    public byte[] getSignatureImage(Long signatureId, String password) throws Exception {
        Signature signature = signatureRepository.findById(signatureId)
                .orElseThrow(() -> new Exception("Signature not found"));

        // You might want to add user ownership check here as well

        if (!passwordEncoder.matches(password, signature.getPassword())) {
            throw new Exception("Invalid password");
        }

        Path path = Paths.get(signature.getImagePath());
        return Files.readAllBytes(path);
    }
}