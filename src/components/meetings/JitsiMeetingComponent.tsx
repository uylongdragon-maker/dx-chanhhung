"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";

export default function JitsiMeetingComponent({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="w-full h-full relative">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName="CDsChanhHungWorkspaceInternal2026"
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: true,
          enableEmailInStats: false,
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        userInfo={{
          displayName: userName,
          email: userEmail,
        }}
        onApiReady={(externalApi) => {
          // Listeners for AI features or automated assignments could go here
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
          iframeRef.style.border = "none";
        }}
      />
    </div>
  );
}
