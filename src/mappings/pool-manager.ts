import { Address } from "@graphprotocol/graph-ts";
import { NonfungiblePositionManager } from "../types/NonfungiblePositionManager/NonfungiblePositionManager";
import { Deposit, Withdraw } from "../types/PoolManager/PoolManager";
import { Pool, Position } from "../types/schema";
import { ADDRESS_ZERO, ZERO_BD, ZERO_BI, factoryContract } from "../utils/constants";
import { loadTransaction } from "../utils";

export function handleDeposit(event: Deposit): void {


    let position = Position.load(event.params.tokenId.toString());
    if (position == null) {
        let contract = NonfungiblePositionManager.bind(event.address)
        let positionCall = contract.try_positions(event.params.tokenId)

        // the following call reverts in situations where the position is minted
        // and deleted in the same block - from my investigation this happens
        // in calls from  BancorSwap
        // (e.g. 0xf7867fa19aa65298fadb8d4f72d0daed5e836f3ba01f0b9b9631cdc6c36bed40)
        if (!positionCall.reverted) {
            let positionResult = positionCall.value
            let poolAddress = factoryContract.getPool(positionResult.value2, positionResult.value3, positionResult.value4)

            position = new Position(event.params.tokenId.toString())
            // The owner gets correctly updated in the Transfer handler
            position.owner = Address.fromString(ADDRESS_ZERO)
            position.pool = poolAddress.toHexString()
            position.token0 = positionResult.value2.toHexString()
            position.token1 = positionResult.value3.toHexString()
            position.tickLower = position.pool.concat('#').concat(positionResult.value5.toString())
            position.tickUpper = position.pool.concat('#').concat(positionResult.value6.toString())
            position.liquidity = ZERO_BI
            position.depositedToken0 = ZERO_BD
            position.depositedToken1 = ZERO_BD
            position.withdrawnToken0 = ZERO_BD
            position.withdrawnToken1 = ZERO_BD
            position.collectedFeesToken0 = ZERO_BD
            position.collectedFeesToken1 = ZERO_BD
            position.transaction = loadTransaction(event).id
            position.feeGrowthInside0LastX128 = positionResult.value8
            position.feeGrowthInside1LastX128 = positionResult.value9
        }
    }
    position!.staker = event.transaction.from.toHex();
    position!.save();

}

export function handleWithdraw(event: Withdraw): void {

    let position = Position.load(event.params.tokenId.toString());
    if (position == null) return;

    position.staker = null;
    position.save();
}
