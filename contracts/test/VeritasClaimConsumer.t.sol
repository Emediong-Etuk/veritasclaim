// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {VeritasClaimConsumer} from "../src/VeritasClaimConsumer.sol";

contract VeritasClaimConsumerTest is Test {
    VeritasClaimConsumer public consumer;
    address public owner = address(0x1);
    address public forwarder = address(0xF0);
    address public user = address(0xA11CE);
    address public attacker = address(0xBAD);

    function setUp() public {
        consumer = new VeritasClaimConsumer(forwarder, owner);
    }

    function test_SubmitClaim() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Did the event happen by 2026-12-31?");
        
        VeritasClaimConsumer.Claim memory claim = consumer.getClaim(claimId);
        assertEq(claim.submitter, user);
        assertEq(uint(claim.status), uint(VeritasClaimConsumer.ClaimStatus.Pending));
    }

    function test_FulfillClaim_HappyPath() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Did the event happen by 2026-12-31?");

        bytes32 reportHash = keccak256("report1");
        uint64 ts = uint64(block.timestamp);

        vm.prank(forwarder);
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.TRUE),
            8500,
            ts,
            3,
            true,
            keccak256("prompt"),
            reportHash
        );

        VeritasClaimConsumer.Claim memory claim = consumer.getClaim(claimId);
        assertEq(uint(claim.status), uint(VeritasClaimConsumer.ClaimStatus.VerifiedTrue));
        assertEq(claim.lastReport.confidence, 8500);
    }

    function test_FulfillClaim_LowConfidence_Reverts() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        vm.prank(forwarder);
        vm.expectRevert(abi.encodeWithSelector(VeritasClaimConsumer.LowConfidence.selector, 5000, 7000));
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.TRUE),
            5000,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            keccak256("r")
        );
    }

    function test_FulfillClaim_NoQuorum_Reverts() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        vm.prank(forwarder);
        vm.expectRevert(VeritasClaimConsumer.NoQuorum.selector);
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.TRUE),
            8500,
            uint64(block.timestamp),
            1,
            false,
            bytes32(0),
            keccak256("r")
        );
    }

    function test_FulfillClaim_StaleReport_Reverts() public {
        vm.warp(block.timestamp + 3 hours);
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        uint64 oldTs = uint64(block.timestamp - 2 hours);

        vm.prank(forwarder);
        vm.expectRevert();
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.TRUE),
            8500,
            oldTs,
            3,
            true,
            bytes32(0),
            keccak256("r")
        );
    }

    function test_FulfillClaim_Unauthorized_Reverts() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        vm.prank(attacker);
        vm.expectRevert(VeritasClaimConsumer.UnauthorizedForwarder.selector);
        consumer.fulfillClaim(
            claimId,
            1,
            8500,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            keccak256("r")
        );
    }

    function test_ExecuteAction_OnlyOnVerifiedTrue() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        vm.prank(forwarder);
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.TRUE),
            9000,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            keccak256("good")
        );

        vm.prank(user);
        consumer.executeAction(claimId, "payout");
    }

    function test_ExecuteAction_RejectedOnFalse() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        vm.prank(forwarder);
        consumer.fulfillClaim(
            claimId,
            uint8(VeritasClaimConsumer.Verdict.FALSE),
            9000,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            keccak256("false")
        );

        vm.prank(user);
        vm.expectRevert();
        consumer.executeAction(claimId, "payout");
    }

    function test_ReplayProtection() public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Test claim for verification");

        bytes32 reportHash = keccak256("unique");

        vm.prank(forwarder);
        consumer.fulfillClaim(
            claimId,
            1,
            8000,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            reportHash
        );

        vm.prank(forwarder);
        vm.expectRevert(abi.encodeWithSelector(VeritasClaimConsumer.ReportAlreadyProcessed.selector, reportHash));
        consumer.fulfillClaim(
            claimId,
            1,
            8000,
            uint64(block.timestamp),
            3,
            true,
            bytes32(0),
            reportHash
        );
    }

    function testFuzz_ConfidenceThreshold(uint16 conf) public {
        vm.prank(user);
        bytes32 claimId = consumer.submitClaim("Fuzz claim for threshold testing");

        vm.prank(forwarder);
        if (conf >= 7000) {
            consumer.fulfillClaim(
                claimId,
                1,
                conf,
                uint64(block.timestamp),
                3,
                true,
                bytes32(0),
                keccak256(abi.encode(conf))
            );
            assertEq(uint(consumer.getClaim(claimId).status), uint(VeritasClaimConsumer.ClaimStatus.VerifiedTrue));
        } else {
            vm.expectRevert();
            consumer.fulfillClaim(
                claimId,
                1,
                conf,
                uint64(block.timestamp),
                3,
                true,
                bytes32(0),
                keccak256(abi.encode(conf))
            );
        }
    }
}
