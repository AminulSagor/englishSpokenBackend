import { IsNotEmpty } from 'class-validator';

export class DeleteConversationDto {
  @IsNotEmpty()
  receiverId: number;
}
