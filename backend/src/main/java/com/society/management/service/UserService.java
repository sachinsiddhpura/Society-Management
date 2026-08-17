package com.society.management.service;

import com.society.management.dto.request.UserUpdateRequest;
import com.society.management.entity.User;
import com.society.management.exception.AccessDeniedCustomException;
import com.society.management.exception.ResourceNotFoundException;
import com.society.management.repository.UserRepository;
import com.society.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public List<User> findForActor(UserPrincipal actor) {
        if (actor.getRole().name().equals("SUPER_ADMIN")) {
            return userRepository.findAll();
        }
        return userRepository.findBySocietyId(actor.getSocietyId());
    }

    public User findById(Long id, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        assertSameSocietyOrSuperAdmin(user, actor);
        return user;
    }

    @Transactional
    public User update(Long id, UserUpdateRequest req, UserPrincipal actor) {
        User user = findById(id, actor);
        if (req.getName() != null) user.setName(req.getName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getFlatNumber() != null) user.setFlatNumber(req.getFlatNumber());
        if (req.getBlockName() != null) user.setBlockName(req.getBlockName());
        if (req.getActive() != null) user.setActive(req.getActive());
        return userRepository.save(user);
    }

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        User user = findById(id, actor);
        userRepository.delete(user);
    }

    private void assertSameSocietyOrSuperAdmin(User user, UserPrincipal actor) {
        boolean isSuperAdmin = actor.getRole().name().equals("SUPER_ADMIN");
        boolean sameSociety = user.getSociety() != null && user.getSociety().getId().equals(actor.getSocietyId());
        if (!isSuperAdmin && !sameSociety) {
            throw new AccessDeniedCustomException("You do not have access to this user");
        }
    }
}
