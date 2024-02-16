import EachMessage from '@/components/chats/EachMessage';
import LiveCodeExecutor from '@/components/tools/LiveCodeExecutor';
import { showToast } from '@/libs/toastify';
import useAutosizeTextArea from '@/libs/useAutosizeTextArea';
import { ChatMessage } from '@/types/chats';
import { useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip'
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

export default function Home() {
  const [inputMessage, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [ratings, setSettingRating] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<string>('');

  const [showSplash, setShowSplash] = useState(true);
  let slug = "746a2a2c-6821-43cc-b5fe-fbed9481747b"

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutosizeTextArea(textAreaRef, inputMessage);

  const sendMessageNow = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const formEvent = event as unknown as React.FormEvent;
      sendMessage(formEvent);
    }
  };

  const scrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };


  const scrollToBottomMore = (x: number) => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight + x;
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    doSendMessage(inputMessage)
  };

  const doSendMessage = async (msg: string) => {
    if (msg.length > 0 && !sending) {
      setSending(true);
      let group_id = uuidv4();
      setCurrentGroup(group_id)
      setMessages(messages => [...messages, {
        id: 0,
        user_id: 1,
        chat_id: 1,
        type: 'message',
        context: 0,
        message: msg,
        group_id
      }]);
      setTimeout(() => {
        scrollToBottom();
      }, 1);
      setMessage('');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(`/api/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: msg, group_id }),
          signal: abortController.signal,
        });
        setSending(false);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMessages(messages => [...messages, data.data]);
        setTimeout(() => {
          scrollToBottomMore(10);
        }, 100);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else if (error instanceof Error) {
          console.error('Error submitting message:', error.message);
        } else {
          console.error('An unexpected error occurred:', error);
        }
        setSending(false);
      } finally {
        abortControllerRef.current = null;
      }
    }
  }

  const retrySending = (message: ChatMessage) => {
    setMessage(message.message)
    setSending(false);
    const filteredMessages = messages.filter(msg =>
      !(msg.group_id === message.group_id)
    );
    setMessages(filteredMessages);
    doSendMessage(message.message)
    deleteMessageByGroupId(message.group_id || "")
  }

  const editSending = (message: ChatMessage) => {
    setMessage(message.message)
    setSending(false);
    const filteredMessages = messages.filter(msg =>
      !(msg.group_id === message.group_id)
    );
    setMessages(filteredMessages);
    deleteMessageByGroupId(message.group_id || "")
  }

  const cancelSending = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();

      setSending(false);
      const getMessage = messages.filter(message =>
        (message.group_id === currentGroup && message.context === 0)
      );

      const filteredMessages = messages.filter(message =>
        !(message.group_id === currentGroup)
      );

      deleteMessageByGroupId(currentGroup)
      setMessages(filteredMessages);
      if (getMessage[0]) {
        setMessage(getMessage[0].message)
      }

    }
  };


  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false)
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${slug}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessages(data.data.reverse());

        setTimeout(() => {
          scrollToBottom();
        }, 200);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [slug]);

  const copyMessage = async (message: string) => {
    await navigator.clipboard.writeText(message);
    showToast("Message copied", "success");
  }


  const setRating = async (messageId: number, rating: number): Promise<void> => {
    setSettingRating(true);
    try {
      const response = await fetch('/api/messages/set-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: messageId, rating: rating }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      showToast("Rating set successfully", "success");

      setMessages(prevMessages =>
        prevMessages.map(message =>
          message.id === messageId
            ? { ...message, rating: message.rating === rating ? 0 : rating }
            : message
        )
      );
    } catch (error: any) {
      console.error('Error setting rating:', error);
    } finally {
      setSettingRating(false);
    }
  };

  async function deleteMessage(messageId: number): Promise<void> {
    const confirmDelete = window.confirm('Are you sure you want to delete this message?');

    if (confirmDelete) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/messages/delete/${messageId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showToast("Message deleted", "success");
        setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
      } catch (error: any) {
        console.error('Error deleting message:', error);
      } finally {
        setIsDeleting(false);
      }
    } else {
      console.log('Deletion cancelled by user.');
    }
  }


  async function deleteMessageByGroupId(groupId: string): Promise<void> {
    try {
      const response = await fetch(`/api/messages/delete-group/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
    } catch (error: any) {
      console.error('Error deleting message:', error);
    } finally {
    }
  }



  return (
    <main className="text-[1rem]">

      <div ref={scrollContainerRef} className="flex justify-center overflow-y-auto h-screen">
        <div className="w-[640px] pt-20">
          <div className="pb-20">
            {messages.map((message, key) =>
              <div key={key} className="flex items-start space-x-3 mb-11 leading-[32px] !text-[#374151]">
                <button className="flex-none">
                  {message.user_id != 0 ?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="4" fill="#19C37D" />
                      <path d="M7.322 7.06H9.366L11.718 11.302L14.07 7.06H16.1L12.628 13.08V17H10.808V13.08L7.322 7.06Z" fill="white" />
                    </svg> :
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="4" fill="#9A08B2" />
                      <path d="M15.492 17H14.33L14.218 15.488C13.77 16.538 12.58 17.224 11.222 17.224C8.394 17.224 6.602 14.97 6.602 12.044C6.602 9.104 8.38 6.836 11.306 6.836C13.518 6.836 15.002 8.152 15.45 10.252L13.56 10.35C13.266 9.146 12.496 8.418 11.278 8.418C9.346 8.418 8.492 10.028 8.492 12.044C8.492 14.046 9.36 15.642 11.278 15.642C12.706 15.642 13.518 14.662 13.672 13.318H11.264V11.876H15.492V17Z" fill="white" />
                    </svg>
                  }
                </button>
                <div>
                  <div className="font-semibold leading-none">{message.user_id != 0 ? 'You' : 'UI Generator'}</div>
                  <div className="flex-1 mt-3.5  display-linebreak">
                    {message.user_id == 0 ? <EachMessage singleMessage={message} /> : message.message}
                  </div>
                  <div className="mt-8 space-x-3.5 text-[#ACACBE]">
                    <button data-tooltip-id="my-tooltip"
                      data-tooltip-content="Copy"
                      data-tooltip-place="top" onClick={() => copyMessage(message.message)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 5H17C18.1046 5 19 5.89543 19 7V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V7C5 5.89543 5.89543 5 7 5H9M15 5V7H9V5M15 5C15 3.89543 14.1046 3 13 3H11C9.89543 3 9 3.89543 9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {message.context == 1 &&
                      <button data-tooltip-id="my-tooltip"
                        data-tooltip-content="Upvote"
                        data-tooltip-place="top" disabled={ratings} className={`disabled:opacity-50 ${message.rating && message.rating == 1 && 'text-green-500'}`} onClick={() => setRating(message.id, 1)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 11H3V20H7M7 11V20M7 11L11 3H11.6156C12.843 3 13.7808 4.09535 13.5917 5.3081L13.0161 9H18.0631C19.8811 9 21.2813 10.6041 21.0356 12.4053L20.3538 17.4053C20.1511 18.8918 18.8815 20 17.3813 20H7" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>}
                    {message.context == 1 &&
                      <button data-tooltip-id="my-tooltip"
                        data-tooltip-content="Downvote"
                        data-tooltip-place="top" disabled={ratings} className={`disabled:opacity-50 ${message.rating && message.rating == 2 && 'text-red-500'}`} onClick={() => setRating(message.id, 2)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 13H21L21 4H17M17 13L17 4M17 13L13.0282 21H12.4147C11.1917 21 10.2572 19.9046 10.4456 18.6919L11.0192 15L5.98994 15C4.17839 15 2.78316 13.3959 3.02793 11.5947L3.70735 6.59466C3.90933 5.1082 5.17443 4 6.66936 4H17" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>}
                    <button data-tooltip-id="my-tooltip"
                      data-tooltip-content="Delete"
                      data-tooltip-place="top" disabled={isDeleting} className="disabled:opacity-50" onClick={() => deleteMessage(message.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.8133 18.1996L6.81109 18.133L5.8133 18.1996ZM18.1867 18.1996L19.1845 18.2661L18.1867 18.1996ZM3 5C2.44772 5 2 5.44772 2 6C2 6.55228 2.44772 7 3 7V5ZM21 7C21.5523 7 22 6.55228 22 6C22 5.44772 21.5523 5 21 5V7ZM14.9056 6.24926C15.0432 6.78411 15.5884 7.1061 16.1233 6.96844C16.6581 6.83078 16.9801 6.28559 16.8424 5.75074L14.9056 6.24926ZM4.00221 6.06652L4.81552 18.2661L6.81109 18.133L5.99779 5.93348L4.00221 6.06652ZM8.80666 22H15.1933V20H8.80666V22ZM19.1845 18.2661L19.9978 6.06652L18.0022 5.93348L17.1889 18.133L19.1845 18.2661ZM19 5H5V7H19V5ZM3 7H5V5H3V7ZM19 7H21V5H19V7ZM15.1933 22C17.2992 22 19.0444 20.3673 19.1845 18.2661L17.1889 18.133C17.1189 19.1836 16.2463 20 15.1933 20V22ZM4.81552 18.2661C4.9556 20.3673 6.7008 22 8.80666 22V20C7.75373 20 6.88113 19.1836 6.81109 18.133L4.81552 18.2661ZM12 4C13.3965 4 14.5725 4.95512 14.9056 6.24926L16.8424 5.75074C16.2874 3.59442 14.3312 2 12 2V4ZM9.09447 6.24926C9.42756 4.95512 10.6035 4 12 4V2C9.66885 2 7.7126 3.59442 7.1576 5.75074L9.09447 6.24926Z" fill="currentColor" />
                      </svg>
                    </button>
                    {message.context == 0 && <button data-tooltip-id="my-tooltip"
                      data-tooltip-content="Edit"
                      data-tooltip-place="top" onClick={() => editSending(message)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4.99998C11.5523 4.99998 12 4.55227 12 3.99998C12 3.4477 11.5523 2.99998 11 2.99998V4.99998ZM21 13C21 12.4477 20.5523 12 20 12C19.4477 12 19 12.4477 19 13H21ZM5.63803 19.673L6.09202 18.782H6.09202L5.63803 19.673ZM4.32698 18.362L3.43597 18.8159H3.43597L4.32698 18.362ZM18.362 19.673L17.908 18.782H17.908L18.362 19.673ZM19.673 18.362L18.782 17.908V17.908L19.673 18.362ZM4.32698 5.63801L5.21799 6.092L4.32698 5.63801ZM5.63803 4.32696L6.09202 5.21797L5.63803 4.32696ZM9 15H8C8 15.5523 8.44772 16 9 16V15ZM9.29289 11.7071L10 12.4142L9.29289 11.7071ZM17.25 3.74998L16.5429 3.04288V3.04288L17.25 3.74998ZM20.25 6.74998L19.5429 6.04287V6.04287L20.25 6.74998ZM12.2929 14.7071L13 15.4142V15.4142L12.2929 14.7071ZM20.25 3.74998L19.5429 4.45709L20.25 3.74998ZM15.2 19H8.8V21H15.2V19ZM5 15.2V8.79998H3V15.2H5ZM8.8 4.99998H11V2.99998H8.8V4.99998ZM19 13V15.2H21V13H19ZM8.8 19C7.94342 19 7.36113 18.9992 6.91104 18.9624C6.47262 18.9266 6.24842 18.8617 6.09202 18.782L5.18404 20.564C5.66937 20.8113 6.18608 20.9099 6.74817 20.9558C7.2986 21.0008 7.97642 21 8.8 21V19ZM3 15.2C3 16.0236 2.99922 16.7014 3.04419 17.2518C3.09012 17.8139 3.18868 18.3306 3.43597 18.8159L5.21799 17.908C5.1383 17.7516 5.07337 17.5274 5.03755 17.0889C5.00078 16.6389 5 16.0566 5 15.2H3ZM6.09202 18.782C5.7157 18.5903 5.40973 18.2843 5.21799 17.908L3.43597 18.8159C3.81947 19.5686 4.43139 20.1805 5.18404 20.564L6.09202 18.782ZM15.2 21C16.0236 21 16.7014 21.0008 17.2518 20.9558C17.8139 20.9099 18.3306 20.8113 18.816 20.564L17.908 18.782C17.7516 18.8617 17.5274 18.9266 17.089 18.9624C16.6389 18.9992 16.0566 19 15.2 19V21ZM19 15.2C19 16.0566 18.9992 16.6389 18.9624 17.0889C18.9266 17.5274 18.8617 17.7516 18.782 17.908L20.564 18.8159C20.8113 18.3306 20.9099 17.8139 20.9558 17.2518C21.0008 16.7014 21 16.0236 21 15.2H19ZM18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.8159L18.782 17.908C18.5903 18.2843 18.2843 18.5903 17.908 18.782L18.816 20.564ZM5 8.79998C5 7.9434 5.00078 7.36111 5.03755 6.91102C5.07337 6.4726 5.1383 6.2484 5.21799 6.092L3.43597 5.18402C3.18868 5.66936 3.09012 6.18606 3.04419 6.74816C2.99922 7.29858 3 7.9764 3 8.79998H5ZM8.8 2.99998C7.97642 2.99998 7.2986 2.9992 6.74817 3.04418C6.18608 3.0901 5.66937 3.18867 5.18404 3.43596L6.09202 5.21797C6.24842 5.13828 6.47262 5.07335 6.91104 5.03753C7.36113 5.00076 7.94342 4.99998 8.8 4.99998V2.99998ZM5.21799 6.092C5.40973 5.71568 5.71569 5.40972 6.09202 5.21797L5.18404 3.43596C4.43139 3.81945 3.81947 4.43137 3.43597 5.18402L5.21799 6.092ZM8 12.4142V15H10V12.4142H8ZM9 16H11.5858V14H9V16ZM10 12.4142L17.9571 4.45709L16.5429 3.04288L8.58579 11L10 12.4142ZM19.5429 6.04287L11.5858 14L13 15.4142L20.9571 7.45709L19.5429 6.04287ZM19.5429 4.45709C19.9808 4.89499 19.9808 5.60497 19.5429 6.04287L20.9571 7.45709C22.1761 6.23814 22.1761 4.26183 20.9571 3.04288L19.5429 4.45709ZM17.9571 4.45709C18.395 4.01919 19.105 4.01919 19.5429 4.45709L20.9571 3.04288C19.7382 1.82392 17.7618 1.82392 16.5429 3.04288L17.9571 4.45709ZM11.5858 16C12.1162 16 12.6249 15.7893 13 15.4142L11.5858 14L11.5858 14V16ZM10 12.4142L8.58579 11C8.21071 11.3751 8 11.8838 8 12.4142H10Z" fill="currentColor" />
                      </svg>
                    </button>}
                    {message.context == 0 &&
                      <button data-tooltip-id="my-tooltip"
                        data-tooltip-content="Retry"
                        data-tooltip-place="top" onClick={() => retrySending(message)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 5L20.4393 7.93934C21.0251 8.52513 21.0251 9.47487 20.4393 10.0607L17.5 13M20 9H7.5C5.01472 9 3 11.0147 3 13.5C3 15.9853 5.01472 18 7.5 18H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </button>}
                  </div>
                </div>
              </div>)}
            {sending && <div className="flex items-start space-x-3 mb-11 leading-[32px] !text-[#374151]">
              <button className="flex-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#9A08B2" />
                  <path d="M15.492 17H14.33L14.218 15.488C13.77 16.538 12.58 17.224 11.222 17.224C8.394 17.224 6.602 14.97 6.602 12.044C6.602 9.104 8.38 6.836 11.306 6.836C13.518 6.836 15.002 8.152 15.45 10.252L13.56 10.35C13.266 9.146 12.496 8.418 11.278 8.418C9.346 8.418 8.492 10.028 8.492 12.044C8.492 14.046 9.36 15.642 11.278 15.642C12.706 15.642 13.518 14.662 13.672 13.318H11.264V11.876H15.492V17Z" fill="white" />
                </svg>
              </button>
              <div>
                <div className="font-semibold leading-none">UI Generator</div>
                <div className="flex-1 mt-3.5 ">
                  <div className="typing-animation">
                    <span className="ball"></span>
                    <span className="ball"></span>
                    <span className="ball"></span>
                  </div>
                </div>
              </div>
            </div>}
          </div>
        </div>
      </div>
      <div className="fixed w-screen bottom-0 flex justify-center bg-white pb-6 pt-4">
        <form ref={formRef} onSubmit={sendMessage} className="border border-[#E4E4E4] rounded-xl p-2.5 w-[640px] flex">
          <textarea
            disabled={sending}
            onChange={(e) => setMessage(e.target.value)}
            ref={textAreaRef}
            onKeyDown={sendMessageNow}
            rows={1}
            className="flex-1 inbox-composer border-none outline-none mt-0.5 text-base mr-2"
            name=""
            id="input-message"
            placeholder="Write a message..."
            value={inputMessage}>
          </textarea>

          {!sending && <button type="submit" className="flex-none disabled:opacity-50">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="30" rx="8" fill="#007AFF" />
              <path d="M10 14L15 9L20 14M15 21V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>}
          {sending && <button type="button" onClick={cancelSending} className="flex-none disabled:opacity-50">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="30" rx="8" fill="#C11700" fill-opacity="0.2" />
              <path d="M17.431 8.25H12.569C11.9653 8.24999 11.467 8.24998 11.0611 8.28315C10.6396 8.31759 10.252 8.39151 9.88803 8.57698C9.32354 8.8646 8.8646 9.32354 8.57698 9.88803C8.39151 10.252 8.31759 10.6396 8.28315 11.0611C8.24998 11.467 8.24999 11.9653 8.25 12.569V17.431C8.24999 18.0347 8.24998 18.533 8.28315 18.9389C8.31759 19.3604 8.39151 19.748 8.57698 20.112C8.8646 20.6765 9.32354 21.1354 9.88803 21.423C10.252 21.6085 10.6396 21.6824 11.0611 21.7169C11.467 21.75 11.9653 21.75 12.569 21.75H17.431C18.0347 21.75 18.533 21.75 18.9389 21.7169C19.3604 21.6824 19.748 21.6085 20.112 21.423C20.6765 21.1354 21.1354 20.6765 21.423 20.112C21.6085 19.748 21.6824 19.3604 21.7169 18.9389C21.75 18.533 21.75 18.0347 21.75 17.431V12.569C21.75 11.9653 21.75 11.467 21.7169 11.0611C21.6824 10.6396 21.6085 10.252 21.423 9.88803C21.1354 9.32354 20.6765 8.8646 20.112 8.57698C19.748 8.39151 19.3604 8.31759 18.9389 8.28315C18.533 8.24998 18.0347 8.24999 17.431 8.25Z" fill="#C11700" />
            </svg>
          </button>}
        </form>
      </div>


      <Toaster position="top-center" />
      <Tooltip id="my-tooltip" />
      {showSplash && <div className="fixed w-screen h-screen bg-white bottom-0 left-0 top-0 right-0 flex items-center justify-center">
        <div>
          <Image src={'/logo.webp'} height={186 / 3} width={950 / 3} alt="Logo" />
        </div>
      </div>}
    </main>
  )
}
