package com.society.management.service;

import com.society.management.dto.request.VisitorEntryRequest;
import com.society.management.entity.Society;
import com.society.management.entity.User;
import com.society.management.entity.VisitorEntry;
import com.society.management.enums.VisitorStatus;
import com.society.management.exception.AccessDeniedCustomException;
import com.society.management.exception.BadRequestException;
import com.society.management.exception.ResourceNotFoundException;
import com.society.management.repository.SocietyRepository;
import com.society.management.repository.UserRepository;
import com.society.management.repository.VisitorEntryRepository;
import com.society.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VisitorEntryService {

    private final VisitorEntryRepository visitorEntryRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    public List<VisitorEntry> findForActor(UserPrincipal actor, VisitorStatus status) {
        Long societyId = resolveSocietyId(actor);
        if (status != null) {
            return visitorEntryRepository.findBySocietyIdAndStatusOrderByEntryTimeDesc(societyId, status);
        }
        return visitorEntryRepository.findBySocietyIdOrderByEntryTimeDesc(societyId);
    }

    public VisitorEntry findById(Long id, UserPrincipal actor) {
        VisitorEntry entry = visitorEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor entry not found with id " + id));
        assertAccess(entry, actor);
        return entry;
    }

    @Transactional
    public VisitorEntry create(VisitorEntryRequest req, UserPrincipal actor) {
        Long societyId = resolveSocietyId(actor);
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found"));

        VisitorEntry entry = VisitorEntry.builder()
                .society(society)
                .visitorName(req.getVisitorName())
                .visitorPhone(req.getVisitorPhone())
                .purpose(req.getPurpose())
                .vehicleNumber(req.getVehicleNumber())
                .flatToVisit(req.getFlatToVisit())
                .blockToVisit(req.getBlockToVisit())
                .hostName(req.getHostName())
                .photoUrl(req.getPhotoUrl())
                .gateNumber(req.getGateNumber())
                .status(VisitorStatus.PENDING)
                .entryTime(LocalDateTime.now())
                .build();

        if (actor.getRole().name().equals("GUARD")) {
            User guard = userRepository.findById(actor.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Guard not found"));
            entry.setCreatedByGuard(guard);
        }

        return visitorEntryRepository.save(entry);
    }

    @Transactional
    public VisitorEntry updateStatus(Long id, VisitorStatus status, UserPrincipal actor) {
        VisitorEntry entry = findById(id, actor);

        if (entry.getStatus() == VisitorStatus.CHECKED_OUT) {
            throw new BadRequestException("This visitor has already checked out");
        }

        entry.setStatus(status);

        if (status == VisitorStatus.APPROVED || status == VisitorStatus.REJECTED) {
            User approver = userRepository.findById(actor.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            entry.setApprovedBy(approver);
        }

        if (status == VisitorStatus.CHECKED_OUT) {
            entry.setExitTime(LocalDateTime.now());
        }

        return visitorEntryRepository.save(entry);
    }

    private Long resolveSocietyId(UserPrincipal actor) {
        if (actor.getSocietyId() == null) {
            throw new BadRequestException("This action requires an account linked to a society");
        }
        return actor.getSocietyId();
    }

    private void assertAccess(VisitorEntry entry, UserPrincipal actor) {
        boolean isSuperAdmin = actor.getRole().name().equals("SUPER_ADMIN");
        boolean sameSociety = entry.getSociety().getId().equals(actor.getSocietyId());
        if (!isSuperAdmin && !sameSociety) {
            throw new AccessDeniedCustomException("You do not have access to this visitor entry");
        }
    }
}
