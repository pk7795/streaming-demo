import { ErmisChat } from 'ermis-chat-js-sdk';
import { API_KEY, BASE_URL } from './config';
import { handleError } from './utils/commons';

let client;
const connectUser = async (projectId, user_id, token, dispatch) => {
  client = ErmisChat.getInstance(API_KEY, projectId, {
    timeout: 6000,
    baseURL: BASE_URL,
  });

  try {
    await client.connectUser(
      {
        api_key: API_KEY,
        id: user_id,
        name: user_id,
        image: '',
      },
      `Bearer ${token}`,
    );
  } catch (error) {
    handleError(dispatch, error);
  }
};

export { client, connectUser };
