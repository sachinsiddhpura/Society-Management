package com.society.management.service;

import com.society.management.dto.request.DeliveryEntryRequest;
import com.society.management.entity.DeliveryEntry;
import com.society.management.entity.Society;
import com.society.management.entity.User;
import com.society.management.enums.DeliveryStatus;
import com.society.management.exception.AccessDeniedCustomException;
import com.society.management.exception.BadRequestException;
import com.society.management.exception.ResourceNotFoundException;
import com.society.management.repository.DeliveryEntryRepository;
import com.society.management.repository.SocietyRepository;
import com.society.management.repository.UserRepository;
import com.society.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeliveryEntryService {

    private final DeliveryEntryRepository deliveryEntryRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    public List<DeliveryEntry> findForActor(UserPrincipal actor, DeliveryStatus status) {
        Long societyId = resolveSocietyId(actor);
        if (status != null) {
            return deliveryEntryRepository.findBySocietyIdAndStatusOrderByEntryTimeDesc(societyId, status);
        }
        return deliveryEntryRepository.findBySocietyIdOrderByEntryTimeDesc(societyId);
    }

    public DeliveryEntry findById(Long id, UserPrincipal actor) {
        DeliveryEntry entry = deliveryEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery entry not found with id " + id));
        assertAccess(entry, actor);
        return entry;
    }

    @Transactional
    public DeliveryEntry create(DeliveryEntryRequest req, UserPrincipal actor) {
        Long societyId = resolveSocietyId(actor);
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found"));

        DeliveryEntry entry = DeliveryEntry.builder()
                .society(society)
                .deliveryPartner(req.getDeliveryPartner())
                .otherPartnerName(req.getOtherPartnerName())
                .agentName(req.getAgentName())
                .agentPhone(req.getAgentPhone())
                .orderId(req.getOrderId())
                .flatNumber(req.getFlatNumber())
                .blockName(req.getBlockName())
                .photoUrl(req.getPhotoUrl())
                .gateNumber(req.getGateNumber())
                .status(DeliveryStatus.IN)
                .entryTime(LocalDateTime.now())
                .build();

        if (actor.getRole().name().equals("GUARD")) {
            User guard = userRepository.findById(actor.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Guard not found"));
            entry.setCreatedByGuard(guard);
        }

        return deliveryEntryRepository.save(entry);
    }

    @Transactional
    public DeliveryEntry checkout(Long id, UserPrincipal actor) {
        DeliveryEntry entry = findById(id, actor);
        if (entry.getStatus() == DeliveryStatus.OUT) {
            throw new BadRequestException("This delivery has already checked out");
        }
        entry.setStatus(DeliveryStatus.OUT);
        entry.setExitTime(LocalDateTime.now());
        return deliveryEntryRepository.save(entry);
    }

    private Long resolveSocietyId(UserPrincipal actor) {
        if (actor.getSocietyId() == null) {
            throw new BadRequestException("This action requires an account linked to a society");
        }
        return actor.getSocietyId();
    }

    private void assertAccess(DeliveryEntry entry, UserPrincipal actor) {
        boolean isSuperAdmin = actor.getRole().name().equals("SUPER_ADMIN");
        boolean sameSociety = entry.getSociety().getId().equals(actor.getSocietyId());
        if (!isSuperAdmin && !sameSociety) {
            throw new AccessDeniedCustomException("You do not have access to this delivery entry");
        }
    }
}
