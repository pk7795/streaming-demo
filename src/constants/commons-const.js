export const ChatType = {
  ALL: [],
  TEAM: 'team',
  MESSAGING: 'messaging',
};

// This function converts the string to lowercase, then perform the conversion
export function toLowerCaseNonAccentVietnamese(str) {
  str = str.toLowerCase();
  //     We can also use this instead of from line 11 to line 17
  //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
  //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
  //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
  //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
  //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
  //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
  //     str = str.replace(/\u0111/g, "d");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
  return str;
}

export const EMOJI_QUICK = [
  {
    type: 'like',
    value: '👍',
  },
  {
    type: 'love',
    value: '❤️',
  },
  {
    type: 'haha',
    value: '😂',
  },
  {
    type: 'sad',
    value: '😔',
  },
  {
    type: 'fire',
    value: '🔥',
  },
];

export const CallType = {
  AUDIO: 'audio',
  VIDEO: 'video',
};

export const CallAction = {
  AUDIO_CREATE: 'audio-create',
  AUDIO_ACCEPT: 'audio-accept',
  AUDIO_REJECT: 'audio-reject',
  AUDIO_ENDED: 'audio-ended',
  AUDIO_SIGNAL: 'audio-signal',
  VIDEO_CREATE: 'video-create',
  VIDEO_ACCEPT: 'video-accept',
  VIDEO_REJECT: 'video-reject',
  VIDEO_ENDED: 'video-ended',
  VIDEO_SIGNAL: 'video-signal',
};

export const CallStatus = {
  CALLING: 'calling', // Trạng thái này được kích hoạt khi bạn bắt đầu một cuộc gọi và hiển thị popup call.
  CONNECTING: 'connecting', // Trạng thái này được kích hoạt khi Simple Peer đang gửi tín hiệu để thiết lập kết nối.
  RECEIVING: 'receiving', // Trạng thái này được kích hoạt khi ứng dụng nhận được tín hiệu cuộc gọi từ người khác và đang chờ người dùng phản hồi (chấp nhận hoặc từ chối).
  CONNECTED: 'connected', // Trạng thái này được kích hoạt khi kết nối giữa hai người dùng đã được thiết lập và họ có thể giao tiếp với nhau qua Simple Peer.
  ERROR: 'error', // Trạng thái này có thể được sử dụng để xử lý các lỗi và thông báo cho người dùng khi có sự cố xảy ra.
};

export const RoleMember = {
  OWNER: 'owner',
  MOD: 'moder',
  MEMBER: 'member',
  PENDING: 'pending',
};

export const ConfirmType = {
  LEAVE: 'leave',
  DELETE: 'delete',
  REMOVE_MEMBER: 'remove_member',
  REMOVE_MODER: 'remove_moder',
  TRUNCATE: 'truncate', // tất cả tin nhắn trong cuộc trò chuyện sẽ bị xoá, chỉ sử dụng cho channel direct
  BLOCK: 'block',
  UNBLOCK: 'unblock',
};

export const TabType = {
  Chat: 0,
  Invite: 1,
};

export const MessageType = {
  Regular: 'regular',
  Reply: 'reply',
  System: 'system',
};

export const SidebarType = {
  Channel: 'CHANNEL',
  Members: 'MEMBERS',
  Media: 'MEDIA',
  Permissions: 'PERMISSIONS',
  Administrators: 'ADMINISTRATORS',
  BannedUsers: 'BANNED_USERS',
  SearchMessage: 'SEARCH_MESSAGE',
  KeywordFiltering: 'KEYWORD_FILTERING',
};

export const TabMembers = {
  Members: 0,
  InvitedMembers: 1,
};

export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'htmlVideo',
};

export const MessageReadType = {
  Empty: 'empty', // Trạng thái khi kênh chưa có tin nhắn nào hoặc vừa xoá hết tin nhắn
  Unread: 'unread', // Trạng thái khi tin nhắn đã được gửi nhưng chưa có ai đọc
  Read: 'read', // Trạng thái khi tin nhắn đã được đọc bởi ít nhất một người
};

export const DefaultLastSend = '1970-01-01T00:00:00Z';

export const LoginType = {
  Wallet: 'wallet',
  Email: 'email',
};
