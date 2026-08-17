package com.society.management.service;

import com.society.management.dto.request.FlatRequest;
import com.society.management.entity.Flat;
import com.society.management.entity.Society;
import com.society.management.entity.User;
import com.society.management.exception.AccessDeniedCustomException;
import com.society.management.exception.BadRequestException;
import com.society.management.exception.ResourceNotFoundException;
import com.society.management.repository.FlatRepository;
import com.society.management.repository.SocietyRepository;
import com.society.management.repository.UserRepository;
import com.society.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FlatService {

    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    public List<Flat> findForActor(UserPrincipal actor) {
        Long societyId = resolveSocietyId(actor);
        return flatRepository.findBySocietyId(societyId);
    }

    public Flat findById(Long id, UserPrincipal actor) {
        Flat flat = flatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flat not found with id " + id));
        assertAccess(flat, actor);
        return flat;
    }

    @Transactional
    public Flat create(FlatRequest req, UserPrincipal actor) {
        Long societyId = resolveSocietyId(actor);
        if (flatRepository.existsBySocietyIdAndBlockNameAndFlatNumber(societyId, req.getBlockName(), req.getFlatNumber())) {
            throw new BadRequestException("This flat already exists in the society");
        }
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found"));

        Flat flat = Flat.builder()
                .society(society)
                .blockName(req.getBlockName())
                .flatNumber(req.getFlatNumber())
                .ownerName(req.getOwnerName())
                .ownerPhone(req.getOwnerPhone())
                .occupied(req.isOccupied())
                .build();

        if (req.getResidentUserId() != null) {
            User resident = userRepository.findById(req.getResidentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resident user not found"));
            flat.setResident(resident);
        }

        return flatRepository.save(flat);
    }

    @Transactional
    public Flat update(Long id, FlatRequest req, UserPrincipal actor) {
        Flat flat = findById(id, actor);
        flat.setBlockName(req.getBlockName());
        flat.setFlatNumber(req.getFlatNumber());
        flat.setOwnerName(req.getOwnerName());
        flat.setOwnerPhone(req.getOwnerPhone());
        flat.setOccupied(req.isOccupied());

        if (req.getResidentUserId() != null) {
            User resident = userRepository.findById(req.getResidentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resident user not found"));
            flat.setResident(resident);
        } else {
            flat.setResident(null);
        }

        return flatRepository.save(flat);
    }

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        Flat flat = findById(id, actor);
        flatRepository.delete(flat);
    }

    private Long resolveSocietyId(UserPrincipal actor) {
        if (actor.getSocietyId() == null) {
            throw new BadRequestException("This action requires an account linked to a society");
        }
        return actor.getSocietyId();
    }

    private void assertAccess(Flat flat, UserPrincipal actor) {
        boolean isSuperAdmin = actor.getRole().name().equals("SUPER_ADMIN");
        boolean sameSociety = flat.getSociety().getId().equals(actor.getSocietyId());
        if (!isSuperAdmin && !sameSociety) {
            throw new AccessDeniedCustomException("You do not have access to this flat");
        }
    }
}
