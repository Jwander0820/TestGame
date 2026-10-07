import { sweptContact, type CollisionRect } from './GoalStampState';

/** 同幀玩家和機關都在移動；必須在同一時刻接觸，不能只重疊軌跡聯集。 */
export function clockworkContact(
  previousTrap: CollisionRect,
  currentTrap: CollisionRect,
  previousPlayer: CollisionRect,
  currentPlayer: CollisionRect,
  wasActive: boolean,
  isActive: boolean,
): boolean {
  return (wasActive || isActive) && sweptContact(previousTrap, currentTrap, previousPlayer, currentPlayer);
}
