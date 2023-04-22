import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useState, useEffect } from "react";
import {
  CallClient,
  DeviceManager,
  CallAgent,
  Call,
  LocalVideoStream,
  RemoteVideoStream,
  VideoStreamRenderer,
  RemoteParticipant,
  VideoStreamRendererView,
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

const Home: NextPage = () => {
  // - Constants
  const localVideoContainerId = "lvContainer";
  const remoteVideoContainerId = "rvContainer";

  // - FOFO

  // - Input states
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [groupIdInput, setgroupIdInput] = useState("");

  // - States
  const [userAccessToken, setUserAccesToken] = useState("");
  const [callControlsEnabled, setCallControlsEnabled] = useState(false);
  const [callendEnabled, setCallendEnabled] = useState(false);

  // - ACS call states
  const [callClient, setCallClient] = useState<CallClient | null>(null);
  const [deviceManager, setDeviceManager] = useState<DeviceManager | null>(
    null
  );
  const [localVideoStream, setLocalVideoStream] =
    useState<LocalVideoStream | null>(null);
  const [localVideoStreamRenderer, setLocalVideoStreamRenderer] =
    useState<VideoStreamRenderer | null>(null);
  const [callAgent, setCallAgent] = useState<CallAgent | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  // - Control

  const initializeCallAgent = async (token: string) => {
    console.log("initializing call agent");

    if (callAgent != null) {
      await callAgent.dispose();
      console.log("call agent disposed");
      setCallAgent(null);
    }

    if (token == "") {
      return;
    }

    try {
      if (callClient == null) {
        throw "call client was null";
      }
      console.log("initializing with token", token);
      var tokenCredential = new AzureCommunicationTokenCredential(token);
      var ca = await callClient.createCallAgent(tokenCredential);

      setCallAgent(ca);
    } catch (error) {
      // TODO error handling
      console.log("failed to create call agent", error);
      setAccessTokenInput("");
      setUserAccesToken("");
      window.alert("Please submit a valid token!");
    }
  };

  var submitToken = function() {
    setUserAccesToken(accessTokenInput);
  };

  // - Input handling
  const handleTokenInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccessTokenInput(e.target.value);
  };

  const handleGroupIdInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setgroupIdInput(e.target.value);
  };

  const handleStartCall = async () => {
    if (callAgent != null && groupIdInput != "") {
      try {
        var c = callAgent.join({ groupId: groupIdInput });
        subscribeToCall(c);
        setCall(c);
      } catch (error) {
        // TODO error handling
        window.alert("failed to create call!");
      }
    } else {
      // TODO error handling
      window.alert("group id to be provided");
    }
  };

  var handleEndCall = async () => {
    if (call != null) {
      await call.hangUp();
      call.dispose();
      setCall(null);
    }
  };

  const initializeCallClient = async () => {
    const calling = await import("@azure/communication-calling");

    const cc = new calling.CallClient();
    const dm = await cc.getDeviceManager();

    setCallClient(cc);
    if (dm != undefined) {
      setDeviceManager(dm);
    }
  };

  // -- Media handling

  const subscribeToCall = (call: Call) => {
    try {
      // Inspect the initial call.id value.
      console.log(`Call Id: ${call.id}`);
      //Subscribe to call's 'idChanged' event for value changes.
      call.on("idChanged", () => {
        console.log(`Call Id changed: ${call.id}`);
      });

      // Inspect the initial call.state value.
      console.log(`Call state: ${call.state}`);
      // Subscribe to call's 'stateChanged' event for value changes.
      call.on("stateChanged", async () => {
        console.log(`Call state changed: ${call.state}`);
        if (call.state === "Connected") {
        } else if (call.state === "Disconnected") {
          console.log(
            `Call ended, call end reason={code=${call.callEndReason?.code}, subCode=${call.callEndReason?.subCode}}`
          );
        }
      });

      call.localVideoStreams.forEach(async (lvs) => {
        await displayLocalVideoStream(lvs);
      });

      call.on("localVideoStreamsUpdated", (e) => {
        e.added.forEach(async (lvs) => {
          await displayLocalVideoStream(lvs);
        });
        e.removed.forEach((lvs) => {
          removeLocalVideoStream(lvs);
        });
      });

      // Inspect the call's current remote participants and subscribe to them.
      call.remoteParticipants.forEach((remoteParticipant) => {
        subscribeToRemoteParticipant(remoteParticipant);
      });
      // Subscribe to the call's 'remoteParticipantsUpdated' event to be
      // notified when new participants are added to the call or removed from the call.
      call.on("remoteParticipantsUpdated", (e) => {
        // Subscribe to new remote participants that are added to the call.
        e.added.forEach((remoteParticipant) => {
          subscribeToRemoteParticipant(remoteParticipant);
        });
        // Unsubscribe from participants that are removed from the call
        e.removed.forEach((remoteParticipant) => {
          console.log("Remote participant removed from the call.");
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  const subscribeToRemoteParticipant = (
    remoteParticipant: RemoteParticipant
  ) => {
    try {
      // Inspect the initial remoteParticipant.state value.
      console.log(`Remote participant state: ${remoteParticipant.state}`);
      // Subscribe to remoteParticipant's 'stateChanged' event for value changes.
      remoteParticipant.on("stateChanged", () => {
        console.log(
          `Remote participant state changed: ${remoteParticipant.state}`
        );
      });

      // Inspect the remoteParticipants's current videoStreams and subscribe to them.
      remoteParticipant.videoStreams.forEach((remoteVideoStream) => {
        subscribeToRemoteVideoStream(remoteVideoStream);
      });
      // Subscribe to the remoteParticipant's 'videoStreamsUpdated' event to be
      // notified when the remoteParticiapant adds new videoStreams and removes video streams.
      remoteParticipant.on("videoStreamsUpdated", (e) => {
        // Subscribe to new remote participant's video streams that were added.
        e.added.forEach((remoteVideoStream) => {
          subscribeToRemoteVideoStream(remoteVideoStream);
        });
        // Unsubscribe from remote participant's video streams that were removed.
        e.removed.forEach((remoteVideoStream) => {
          console.log("Remote participant video stream was removed.");
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  const subscribeToRemoteVideoStream = async (
    remoteVideoStream: RemoteVideoStream
  ) => {
    const calling = await import("@azure/communication-calling");
    let renderer = new calling.VideoStreamRenderer(remoteVideoStream);
    let view: VideoStreamRendererView;
    let remoteVideoContainer = document.createElement("div");
    remoteVideoContainer.className = "remote-video-container";

    const remoteVideosGallery = document.getElementById(remoteVideoContainerId);
    if (remoteVideosGallery == null) {
      console.log("remote video gallery not found");
      return;
    }

    const createView = async () => {
      // Create a renderer view for the remote video stream.
      view = await renderer.createView();
      // Attach the renderer view to the UI.
      remoteVideoContainer.appendChild(view.target);
      remoteVideosGallery.appendChild(remoteVideoContainer);
    };

    // Remote participant has switched video on/off
    remoteVideoStream.on("isAvailableChanged", async () => {
      try {
        if (remoteVideoStream.isAvailable) {
          await createView();
        } else {
          view.dispose();
          remoteVideosGallery.removeChild(remoteVideoContainer);
        }
      } catch (e) {
        console.error(e);
      }
    });

    // Remote participant has video on initially.
    if (remoteVideoStream.isAvailable) {
      try {
        await createView();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // TODO: just getting this to work for now, it's bad
  const displayLocalVideoStream = async (lvs: LocalVideoStream) => {
    if (deviceManager == null) {
      console.log("no device manager found");
      return;
    }

    if (localVideoStream != null) {
      console.log("existing local video stream found");
      // TODO handle..?
    }

    const calling = await import("@azure/communication-calling");

    try {
      await deviceManager.askDevicePermission({ video: true, audio: true });
      const camera = (await deviceManager.getCameras())[0];
      if (camera) {
        const lvsr = new calling.VideoStreamRenderer(lvs);
        const lvContainer = document.getElementById(localVideoContainerId);
        if (lvContainer != null) {
          const v = await lvsr.createView();
          lvContainer.appendChild(v.target);
        } else {
          // TODO error handling
          console.log("lv container was missing");
        }
        setLocalVideoStream(lvs);
        setLocalVideoStreamRenderer(lvsr);
      } else {
        console.error(`No camera device found on the system`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeLocalVideoStream = async (lvs: LocalVideoStream) => {
    if (localVideoStreamRenderer == null) {
      // TODO handle
    }
    // TODO views may need to be disposed here too
    localVideoStreamRenderer?.dispose();
    setLocalVideoStreamRenderer(null);
    setLocalVideoStream(null);
  };

  useEffect(() => {
    if (callClient == null) {
      initializeCallClient();
    }
  }, [callClient]);

  useEffect(() => {
    initializeCallAgent(userAccessToken);
  }, [userAccessToken]);

  useEffect(() => {
    if (callAgent == null) {
      setCallControlsEnabled(false);
    } else {
      setCallControlsEnabled(true);
    }
  }, [callAgent]);

  useEffect(() => {
    if (call == null) {
      setCallendEnabled(false);
    } else {
      setCallendEnabled(true);
    }
  }, [call]);

  // - View
  return (
    <>
      <Head>
        <title>Communication Client - Calling Sample</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#0F2027] to-[#162f39]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-xs font-extrabold tracking-tight text-slate-300 sm:text-[2rem]">
            <span className="text-[#53ad77]">Azure</span> Communication Services
          </h1>
          <h1 className="text-xs font-extrabold tracking-tight text-slate-300 sm:text-[1.5rem]">
            Calling Quickstart
          </h1>

          <div className="container flex flex-col items-center justify-center gap-12 rounded-lg bg-slate-900 px-4 py-16">
            <div className="container flex flex-col items-center justify-center gap-2">
              <input
                id="token-input"
                type="text"
                placeholder="User access token"
                onChange={handleTokenInputChange}
                value={accessTokenInput}
                disabled={callendEnabled}
              />
              <button
                id="token-submit"
                type="button"
                className="rounded-full bg-[#53ad77] px-3 py-1 hover:bg-[#4a9c6b] "
                onClick={submitToken}
              >
                Submit
              </button>
            </div>

            <div className="container flex flex-col items-center justify-center gap-2">
              <input
                id="callee-id-input"
                type="text"
                disabled={!callControlsEnabled && callendEnabled}
                onChange={handleGroupIdInputChange}
                value={groupIdInput}
                placeholder="Group Id"
              />
              <div>
                <button
                  id="call-button"
                  type="button"
                  disabled={!callControlsEnabled || callendEnabled}
                  className="rounded-full bg-[#53ad77] px-3 py-1 hover:bg-[#4a9c6b] disabled:bg-[#316847]"
                  onClick={handleStartCall}
                >
                  Join Call
                </button>
                &nbsp;
                <button
                  id="hang-up-button"
                  type="button"
                  disabled={!callControlsEnabled || !callendEnabled}
                  className="rounded-full bg-[#53ad77] px-3 py-1 hover:bg-[#4a9c6b] disabled:bg-[#316847]"
                  onClick={handleEndCall}
                >
                  Hang Up
                </button>
              </div>
            </div>
          </div>

          <div className="container flex flex-col items-center justify-center gap-12 rounded-lg bg-slate-900 px-4 py-16">
            <div id={localVideoContainerId}></div>
            <div id={remoteVideoContainerId}></div>
          </div>
        </div>
      </main>
    </>
  );
};
export default Home;
