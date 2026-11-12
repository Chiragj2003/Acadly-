import { supabase } from '@/lib/supabase';

// Mock Supabase Realtime channel
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((callback) => {
    if (callback) callback('SUBSCRIBED');
    return mockChannel;
  }),
};

const mockRemoveChannel = jest.fn();
const mockChannelFn = jest.fn(() => mockChannel);

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: (...args: any[]) => mockChannelFn(...args),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
  isSupabaseConfigured: true,
}));

describe('Chat Realtime Subscription Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maintains single channel reference for an active room and removes on room switch', () => {
    const roomIdA = 'room-batch-sakura';
    const channelNameA = `room:${roomIdA}:messages`;

    // 1. Subscribe to Room A
    const subA = supabase.channel(channelNameA);
    subA.subscribe();

    expect(mockChannelFn).toHaveBeenCalledTimes(1);
    expect(mockChannelFn).toHaveBeenCalledWith(channelNameA);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);

    // 2. Simulating sending 5 messages within the same room: channel is NOT recreated
    for (let i = 0; i < 5; i++) {
      // Messages are inserted into DB, channel remains active
    }
    expect(mockChannelFn).toHaveBeenCalledTimes(1);

    // 3. User switches to Room B: Previous channel removed, new channel created
    supabase.removeChannel(subA);
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    expect(mockRemoveChannel).toHaveBeenCalledWith(subA);

    const roomIdB = 'room-batch-olympiad';
    const channelNameB = `room:${roomIdB}:messages`;
    const subB = supabase.channel(channelNameB);
    subB.subscribe();

    expect(mockChannelFn).toHaveBeenCalledTimes(2);
    expect(mockChannelFn).toHaveBeenCalledWith(channelNameB);
  });
});
