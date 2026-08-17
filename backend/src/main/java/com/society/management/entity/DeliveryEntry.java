package com.society.management.entity;

import com.society.management.enums.DeliveryPartner;
import com.society.management.enums.DeliveryStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "society_id")
    private Society society;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_partner", nullable = false)
    private DeliveryPartner deliveryPartner;

    @Column(name = "other_partner_name")
    private String otherPartnerName;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "agent_phone")
    private String agentPhone;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "flat_number")
    private String flatNumber;

    @Column(name = "block_name")
    private String blockName;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "gate_number")
    private String gateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.IN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_guard_id")
    private User createdByGuard;

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
