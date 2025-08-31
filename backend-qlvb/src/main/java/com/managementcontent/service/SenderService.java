package com.managementcontent.service;

import com.managementcontent.dto.SenderDTO;
import com.managementcontent.model.Sender;
import com.managementcontent.repository.SenderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SenderService {
    private final SenderRepository senderRepository;
    
    /**
     * Get all senders
     */
    public List<SenderDTO> getAllSenders() {
        return senderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get sender by ID
     */
    public Optional<SenderDTO> getSenderById(Long id) {
        return senderRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    /**
     * Create new sender
     */
    @Transactional
    public SenderDTO createSender(SenderDTO senderDTO) {
        Sender sender = new Sender();
        sender.setName(senderDTO.getName());
        sender.setDescription(senderDTO.getDescription());
        //check sender in db
        Sender alredySender = senderRepository.findByName(sender.getName()).orElse(null);
        if (alredySender != null){
            return null;
        }
        System.out.println("Creating new sender");
        Sender savedSender = senderRepository.save(sender);
        return convertToDTO(savedSender);
    }
    
    /**
     * Update sender
     */
    @Transactional
    public Optional<SenderDTO> updateSender(Long id, SenderDTO senderDTO) {
        return senderRepository.findById(id)
                .map(sender -> {
                    if (senderDTO.getName() != null) sender.setName(senderDTO.getName());
                    if (senderDTO.getDescription() != null) sender.setDescription(senderDTO.getDescription());
                    
                    Sender updatedSender = senderRepository.save(sender);
                    return convertToDTO(updatedSender);
                });
    }
    
    /**
     * Delete sender
     */
    @Transactional
    public boolean deleteSender(Long id) {
        if (senderRepository.existsById(id)) {
            senderRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Convert Sender entity to SenderDTO
     */
    private SenderDTO convertToDTO(Sender sender) {
        SenderDTO dto = new SenderDTO();
        dto.setId(sender.getId());
        dto.setName(sender.getName());
        dto.setDescription(sender.getDescription());
        dto.setCreatedAt(sender.getCreatedAt());
        dto.setUpdatedAt(sender.getUpdatedAt());
        return dto;
    }
}