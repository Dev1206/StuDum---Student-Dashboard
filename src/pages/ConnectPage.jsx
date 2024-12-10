import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';
import { chatService } from '../services/chatService.jsx';
import { RiSendPlaneFill, RiGroupLine, RiUserAddLine, RiSearchLine, RiSettings4Line, 
         RiDeleteBin6Line, RiEditLine, RiCloseLine, RiMessage2Line } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import { H1, H2, Body1, Body2, Caption } from '../components/ui/Typography';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Container from '../components/ui/Container';

function ConnectPage() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch user's chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userChats = await chatService.getUserChats(currentUser.email);
        setChats(userChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };
    fetchChats();
  }, [currentUser]);

  // Fetch messages when chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat) {
        try {
          const chatMessages = await chatService.getChatMessages(selectedChat._id);
          setMessages(chatMessages);
          await chatService.markMessagesAsRead(selectedChat._id, currentUser.email);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    fetchMessages();
  }, [selectedChat, currentUser]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const message = await chatService.sendMessage(
        selectedChat._id,
        currentUser.email,
        newMessage
      );
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateDirectChat = async (participant2) => {
    if (!participant2.trim()) return;
    
    try {
      const chat = await chatService.createDirectChat(currentUser.email, participant2);
      setChats([chat, ...chats]);
      setSelectedChat(chat);
      setShowNewChat(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleCreateGroupChat = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    try {
      const chat = await chatService.createGroupChat(newGroupName, [
        currentUser.email,
        ...selectedUsers,
      ]);
      setChats([chat, ...chats]);
      setSelectedChat(chat);
      setShowNewGroup(false);
      setNewGroupName('');
      setSelectedUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedChat || !window.confirm('Are you sure you want to delete this group?')) return;

    try {
      await chatService.deleteGroupChat(selectedChat._id, currentUser.email);
      setChats(chats.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleUpdateGroupMembers = async (newParticipants) => {
    if (!selectedChat) return;

    try {
      const updatedChat = await chatService.updateGroupMembers(
        selectedChat._id,
        currentUser.email,
        newParticipants || [currentUser.email, ...selectedUsers]
      );
      setChats(chats.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      ));
      setSelectedChat(updatedChat);
      setShowEditGroup(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error updating group members:', error);
    }
  };

  const handleUpdateGroupName = async (newName) => {
    if (!selectedChat || !newName.trim()) return;

    try {
      const updatedChat = await chatService.updateGroupName(
        selectedChat._id,
        currentUser.email,
        newName
      );
      setChats(chats.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      ));
      setSelectedChat(updatedChat);
    } catch (error) {
      console.error('Error updating group name:', error);
    }
  };

  const handleAddMember = () => {
    if (!searchTerm.trim() || 
        selectedUsers.includes(searchTerm) || 
        selectedChat?.participants.includes(searchTerm)) {
      return;
    }
    setSelectedUsers([...selectedUsers, searchTerm]);
    setSearchTerm('');
  };

  return (
    <MainLayout>
      <Container>
        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden my-8">
          <div className="h-[calc(100vh-150px)] flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-secondary-100 flex flex-col bg-secondary-50/30">
              <div className="p-6 border-b border-secondary-100">
                <div className="flex items-center justify-between mb-6">
                  <H2 className="text-xl font-semibold">Messages</H2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowNewChat(true)}
                      className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50"
                      title="New Chat"
                    >
                      <RiUserAddLine className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowNewGroup(true)}
                      className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50"
                      title="New Group"
                    >
                      <RiGroupLine className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-secondary-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                      transition-colors"
                  />
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-300
                      hover:bg-secondary-50 ${selectedChat?._id === chat._id ? 'bg-primary-50 hover:bg-primary-50/80' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white
                      ${chat.chatType === 'group' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 
                      'bg-gradient-to-br from-secondary-500 to-secondary-600'}`}
                    >
                      {chat.chatType === 'group' ? (
                        <RiGroupLine className="w-6 h-6" />
                      ) : (
                        <span className="text-lg font-medium">
                          {chat.participants.find(p => p !== currentUser.email)?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <H2 className="text-sm font-medium text-secondary-900 truncate">
                        {chat.chatType === 'group'
                          ? chat.name
                          : chat.participants.find(p => p !== currentUser.email)}
                      </H2>
                      <Caption className="text-secondary-500">Click to view messages</Caption>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedChat ? (
                <>
                  <div className="px-6 py-4 border-b border-secondary-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white
                          ${selectedChat.chatType === 'group' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 
                          'bg-gradient-to-br from-secondary-500 to-secondary-600'}`}
                        >
                          {selectedChat.chatType === 'group' ? (
                            <RiGroupLine className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">
                              {selectedChat.participants.find(p => p !== currentUser.email)?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <H2 className="text-lg font-semibold text-secondary-900">
                            {selectedChat.chatType === 'group'
                              ? selectedChat.name
                              : selectedChat.participants.find(p => p !== currentUser.email)}
                          </H2>
                          <Caption className="text-secondary-500">
                            {selectedChat.chatType === 'group' ? 
                              `${selectedChat.participants.length} members` : 'Direct Message'}
                          </Caption>
                        </div>
                      </div>
                      {selectedChat.chatType === 'group' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowEditGroup(true)}
                            className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50"
                            title="Edit Group"
                          >
                            <RiSettings4Line className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleDeleteGroup}
                            className="text-secondary-600 hover:text-error-600 hover:bg-error-50"
                            title="Delete Group"
                          >
                            <RiDeleteBin6Line className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          message.sender === currentUser.email ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.sender === currentUser.email
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            : 'bg-secondary-50 text-secondary-900'
                        }`}>
                          <p className="break-words">{message.content}</p>
                          <span className={`text-xs mt-1 block ${
                            message.sender === currentUser.email
                              ? 'text-white/80'
                              : 'text-secondary-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form 
                    className="p-4 border-t border-secondary-100 bg-white"
                    onSubmit={handleSendMessage}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                          transition-colors"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-primary-600 to-primary-500 text-white 
                          shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RiSendPlaneFill className="w-5 h-5" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-50 
                    text-primary-600 rounded-full flex items-center justify-center mb-6">
                    <RiMessage2Line className="w-10 h-10" />
                  </div>
                  <H2 className="text-2xl font-bold text-secondary-900 mb-2">
                    Select a chat to start messaging
                  </H2>
                  <Body1 color="secondary">
                    Or create a new chat using the buttons on the left
                  </Body1>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* New Chat Modal */}
          {showNewChat && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center 
                justify-center p-4 z-50"
              onClick={() => {
                setShowNewChat(false);
                setSearchTerm('');
              }}
            >
              <motion.div 
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Card variant="elevated" className="shadow-2xl">
                  <CardHeader className="p-6 flex items-center justify-between border-b border-secondary-100">
                    <H2 className="text-2xl font-bold">New Chat</H2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewChat(false);
                        setSearchTerm('');
                      }}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <RiCloseLine className="w-6 h-6" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Enter Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter user email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-secondary-200
                          focus:ring-2 focus:ring-primary/20 focus:border-primary
                          transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowNewChat(false);
                          setSearchTerm('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleCreateDirectChat(searchTerm)}
                        className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                      >
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* New Group Modal */}
          {showNewGroup && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center 
                justify-center p-4 z-50"
              onClick={() => {
                setShowNewGroup(false);
                setNewGroupName('');
                setSelectedUsers([]);
                setSearchTerm('');
              }}
            >
              <motion.div 
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Card variant="elevated" className="shadow-2xl">
                  <CardHeader className="p-6 flex items-center justify-between border-b border-secondary-100">
                    <H2 className="text-2xl font-bold">New Group</H2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewGroup(false);
                        setNewGroupName('');
                        setSelectedUsers([]);
                        setSearchTerm('');
                      }}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <RiCloseLine className="w-6 h-6" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-secondary-200
                          focus:ring-2 focus:ring-primary/20 focus:border-primary
                          transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Add Members
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Enter email address..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl border border-secondary-200
                            focus:ring-2 focus:ring-primary/20 focus:border-primary
                            transition-colors"
                        />
                        <Button
                          variant="primary"
                          onClick={handleAddMember}
                          className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {selectedUsers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-secondary-700 mb-3">
                          Selected Members
                        </h3>
                        <div className="space-y-2">
                          {selectedUsers.map((user, index) => (
                            <div 
                              key={`${user}-${index}`} 
                              className="flex items-center justify-between p-3 bg-secondary-50 
                                rounded-xl border border-secondary-100"
                            >
                              <span className="text-sm text-secondary-900">{user}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedUsers(selectedUsers.filter((_, i) => i !== index))
                                }
                                className="text-error-600 hover:bg-error-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowNewGroup(false);
                          setNewGroupName('');
                          setSelectedUsers([]);
                          setSearchTerm('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCreateGroupChat}
                        className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                      >
                        Create Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Edit Group Modal */}
          {showEditGroup && selectedChat?.chatType === 'group' && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center 
                justify-center p-4 z-50"
              onClick={() => {
                setShowEditGroup(false);
                setSelectedUsers([]);
                setSearchTerm('');
              }}
            >
              <motion.div 
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Card variant="elevated" className="shadow-2xl">
                  <CardHeader className="p-6 flex items-center justify-between border-b border-secondary-100">
                    <H2 className="text-2xl font-bold">Edit Group</H2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowEditGroup(false);
                        setSelectedUsers([]);
                        setSearchTerm('');
                      }}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <RiCloseLine className="w-6 h-6" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={selectedChat.name}
                        onChange={(e) => handleUpdateGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="w-full px-4 py-2 rounded-xl border border-secondary-200
                          focus:ring-2 focus:ring-primary/20 focus:border-primary
                          transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Add Members
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Enter email address"
                          className="flex-1 px-4 py-2 rounded-xl border border-secondary-200
                            focus:ring-2 focus:ring-primary/20 focus:border-primary
                            transition-colors"
                        />
                        <Button
                          variant="primary"
                          onClick={handleAddMember}
                          className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 mb-3">
                        Current Members
                      </h3>
                      <div className="space-y-2">
                        {selectedChat.participants.map((participant, index) => (
                          <div 
                            key={`${participant}-${index}`} 
                            className="flex items-center justify-between p-3 bg-secondary-50 
                              rounded-xl border border-secondary-100"
                          >
                            <span className="text-sm text-secondary-900">{participant}</span>
                            {participant !== currentUser.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newParticipants = selectedChat.participants.filter(
                                    p => p !== participant
                                  );
                                  handleUpdateGroupMembers(newParticipants);
                                }}
                                className="text-error-600 hover:bg-error-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedUsers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-secondary-700 mb-3">
                          New Members to Add
                        </h3>
                        <div className="space-y-2">
                          {selectedUsers.map((user, index) => (
                            <div 
                              key={`new-${user}-${index}`} 
                              className="flex items-center justify-between p-3 bg-secondary-50 
                                rounded-xl border border-secondary-100"
                            >
                              <span className="text-sm text-secondary-900">{user}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedUsers(selectedUsers.filter((_, i) => i !== index))
                                }
                                className="text-error-600 hover:bg-error-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowEditGroup(false);
                          setSelectedUsers([]);
                          setSearchTerm('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateGroupMembers()}
                        className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Container>
    </MainLayout>
  );
}

export default ConnectPage; 