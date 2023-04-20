import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useState, useEffect } from "react";

const Home: NextPage = () => {
  // - FOFO

  // - States
  const [userAccessToken, setUserAccesToken] = useState("");
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [callControlsEnabled, setCallControlsEnabled] = useState(false);
  const [callendEnabled, setCallendEnabled] = useState(false);

  // - Control
  var submitToken = function() {
    setUserAccesToken(accessTokenInput);
  };

  const handleTokenInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccessTokenInput(e.target.value);
  };

  var handleEndCall = async () => { };

  const handleStartCall = async () => {
    if (typeof window !== "undefined") {
      console.log("calling")

      const calling = await import('@azure/communication-calling')
      const commsCommon = await import('@azure/communication-common')

      const callClient = new calling.CallClient();
      try {
        var tokenCredential = new commsCommon.AzureCommunicationTokenCredential(userAccessToken);
        var callAgent = await callClient.createCallAgent(tokenCredential);
        setCallendEnabled(true);
      } catch (error) {
        window.alert("Please submit a valid token!");
      }
    } else {
      // TODO Error 
      console.log("failed calling, no window defined")
    }
  }

  useEffect(() => {
    // handleStartCall = ;
  }, []);

  useEffect(() => {
    setCallControlsEnabled(userAccessToken != "");
  }, [userAccessToken]);

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
                placeholder="Who would you like to call?"
              />
              <div>
                <button
                  id="call-button"
                  type="button"
                  disabled={!callControlsEnabled || callendEnabled}
                  className="rounded-full bg-[#53ad77] px-3 py-1 hover:bg-[#4a9c6b] disabled:bg-[#316847]"
                  onClick={handleStartCall}
                >
                  Start Call
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
