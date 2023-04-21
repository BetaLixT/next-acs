import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useState, useEffect } from "react";
import { CallAgent, Call } from "@azure/communication-calling";

const Home: NextPage = () => {
  // - FOFO

  // - Input states
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [groupIdInput, setgroupIdInput] = useState("");

  // - States
  const [userAccessToken, setUserAccesToken] = useState("");
  const [callControlsEnabled, setCallControlsEnabled] = useState(false);
  const [callendEnabled, setCallendEnabled] = useState(false);

  // - ACS call states
  const [callAgent, setCallAgent] = useState<CallAgent | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  // - Control

  const initializeCallAgent = async (token: string) => {
    console.log("initializing call agent");

    const calling = await import("@azure/communication-calling");
    const commsCommon = await import("@azure/communication-common");

    if (callAgent != null) {
      await callAgent.dispose();
      console.log("call agent disposed");
      setCallAgent(null);
    }

    if (token == "") {
      return;
    }

    const callClient = new calling.CallClient();
    try {
      console.log("initializing with token", token);
      var tokenCredential = new commsCommon.AzureCommunicationTokenCredential(
        token
      );
      var ca = await callClient.createCallAgent(tokenCredential);

      setCallAgent(ca);
    } catch (error) {
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

  useEffect(() => {
    // handleStartCall = ;
  }, []);

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
        </div>
      </main>
    </>
  );
};
export default Home;
