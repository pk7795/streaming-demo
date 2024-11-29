import { LocalStorageKey } from '../constants/localStorage-const';
import { formatString, getMemberInfo } from './commons';

export function convertMessageSystem(input, all_members, isDirect) {
  if (!input) return '';

  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const userId = parts[1];
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const isMe = myUserId === userId;
  const memberInfo = getMemberInfo(userId, all_members);
  const userName = memberInfo ? formatString(memberInfo.name) : formatString(userId);
  const name = isMe ? 'You' : userName;

  let channelName = '';
  let duration = '';
  let channelType = '';
  if (number === 1) {
    channelName = parts.slice(2).join(' ');
  }

  if (number === 14) {
    channelType = parts[2] === 'true' ? 'public' : 'private';
  }

  if (number === 15) {
    duration = parts[2];
  }

  // Xác định message tương ứng với number
  let message;
  switch (number) {
    case 1: // UpdateName
      message = `${name} changed the channel name to ${formatString(channelName, 20, 20)}`;
      break;
    case 2: // UpdateImageDesc
      message = `${name} has changed the channel avatar`;
      break;
    case 3: // UpdateDescription
      message = `${name} has changed the channel description`;
      break;
    case 4: // MemberRemoved
      message = `${name} has been removed from this channel`;
      break;
    case 5: // MemberBanned
      message = `${name} has been banned from interacting in this channel by Channel Admin`;
      break;
    case 6: // MemberUnbanned
      message = `${name} have been unbanned and now can interact in this channel`;
      break;
    case 7: // MemberPromoted
      message = `${name} has been assigned as the moderator for this channel`;
      break;
    case 8: // MemberDemoted
      message = `${name} has been removed as the moderator from this channel`;
      break;
    case 9: // UpdateChannelMemberCapabilities
      message = `${name} has updated member permission of channel`;
      break;
    case 10: // InviteAccepted
      message = `${name} have joined this ${isDirect ? 'conversation' : 'channel'}`;
      break;
    case 11: // InviteRejected
      message = `${name} has declined to join this channel`;
      break;
    case 12: // MemberLeave
      message = `${name} has leaved this channel`;
      break;
    case 13: // TruncateMessages
      message = `${name} has truncate all messages of this channel`;
      break;
    case 14: // UpdatePublic
      message = `${name} has made this channel ${channelType}`;
      break;
    case 15: // UpdateMemberMessageCooldown
      message =
        duration === '0'
          ? `Cooldown has been disabled`
          : `Cooldown feature enabled by Channel Admin. Cooldown duration set to ${convertDuration(duration)}`;
      break;
    case 16: // UpdateFilterWords
      message = `${name} has update channel filter words`;
      break;
    case 17: // MemberJoined
      message = `${name} has been joined to this channel`;
      break;
    default:
      message = input;
  }

  return message;
}

export function convertDuration(duration) {
  let durationText;
  switch (duration) {
    case '10000':
      durationText = '10 seconds';
      break;
    case '30000':
      durationText = '30 seconds';
      break;
    case '60000':
      durationText = '1 minutes';
      break;
    case '300000':
      durationText = '5 minutes';
      break;
    case '900000':
      durationText = '15 minutes';
      break;
    case '3600000':
      durationText = '60 minutes';
      break;
    default:
      durationText = '';
      break;
  }

  return durationText;
}
