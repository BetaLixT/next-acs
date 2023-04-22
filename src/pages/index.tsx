import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useState, useEffect } from "react";
import {
  CallClient,
  DeviceManager,
  CallAgent,
  Call,
  LocalVideoStream,
  VideoStreamRenderer,
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

const Home: NextPage = () => {
  // - Constants
  const localVideoContainerId = "lvContainer";

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
    // const commsCommon = await import("@azure/communication-common");

    const cc = new calling.CallClient();
    const dm = await cc.getDeviceManager();

    setCallClient(cc);
    if (dm != undefined) {
      await dm.askDevicePermission({ video: true, audio: true });
      const camera = (await dm.getCameras())[0];
      if (camera) {
        const lvs = new calling.LocalVideoStream(camera);
        const localVideoStreamRenderer = new calling.VideoStreamRenderer(lvs);
        const lvContainer = document.getElementById(localVideoContainerId);
        if (lvContainer != null) {
          const v = await localVideoStreamRenderer.createView();
          lvContainer.appendChild(v.target);
        } else {
          // TODO error handling
          console.log("lv container was missing");
        }
        setLocalVideoStream(lvs);
      } else {
        console.error(`No camera device found on the system`);
      }
      // await dm.askDevicePermission({ video: false, audio: true });
      setDeviceManager(dm);
    }
  };

  // -- Media handlinG

  const displayLocalVideoStream = async () => {
    try {
      //
      // const view = await localVideoStreamRenderer.createView();
      // localVideoContainer.hidden = false;
      // localVideoContainer.appendChild(view.target);
    } catch (error) {
      console.error(error);
    }
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
          </div>
        </div>
      </main>
    </>
  );
};
export default Home;
