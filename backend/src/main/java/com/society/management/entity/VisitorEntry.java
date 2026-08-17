package com.society.management.entity;

import com.society.management.enums.VisitorStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "society_id")
    private Society society;

    @Column(name = "visitor_name", nullable = false)
    private String visitorName;

    @Column(name = "visitor_phone")
    private String visitorPhone;

    private String purpose;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "flat_to_visit")
    private String flatToVisit;

    @Column(name = "block_to_visit")
    private String blockToVisit;

    @Column(name = "host_name")
    private String hostName;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "gate_number")
    private String gateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VisitorStatus status = VisitorStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_guard_id")
    private User createdByGuard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @PrePersist
    protected void onCreate() {
        if (this.entryTime == null) {
            this.entryTime = LocalDateTime.now();
        }
    }
}
