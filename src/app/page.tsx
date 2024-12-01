'use client';

import {useEffect, useState} from "react";
import {
    login,
    handleIncomingRedirect,
    getDefaultSession,
    fetch
} from "@inrupt/solid-client-authn-browser";

import {
    addUrl,
    addStringNoLocale,
    createSolidDataset,
    createThing,
    getPodUrlAll,
    getSolidDataset,
    getThingAll,
    getStringNoLocale,
    removeThing,
    saveSolidDatasetAt,
    setThing
} from "@inrupt/solid-client";

import {SCHEMA_INRUPT, RDF, AS} from "@inrupt/vocab-common-rdf";
import Image from "next/image";

export default function Home() {
    const [idp, setIdp] = useState("");
    const [pod, setPod] = useState("");
    const [webID, setWebID] = useState("");
    const [pods, setPods] = useState<string[]>([]);
    const [titles, setTitles] = useState("Leaves of Grass\nRDF 1.1 Primer");
    const [savedTitles, setSavedTitles] = useState("");
    const [status, setStatus] = useState("");

    const handleIdpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIdp(e.target.value);
    };

    const handlePodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPod(e.target.value);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitles(e.target.value);
    };

    const handleLogin = async () => {
        await login({
            oidcIssuer: idp,
            redirectUrl: window.location.href,
            clientName: "Getting Started App",
        });
    };

    const handleRedirectAfterLogin = async () => {
        await handleIncomingRedirect();
        const session = getDefaultSession();
        if (session.info.isLoggedIn) {
            setWebID(session.info.webId || "");
        }
    };

    const handleGetPods = async () => {
        if (webID) {
            const myPods = await getPodUrlAll(webID, {fetch});
            setPods(myPods);
        }
    };

    const handleCreateList = async () => {
        if (!pod) return;
        setStatus("");

        const readingListUrl = `${pod}getting-started/readingList/myList`;
        const titlesArray = titles.split("\n").filter((t) => t.trim() !== "");

        let myReadingList = createSolidDataset()
        try {
            myReadingList = await getSolidDataset(readingListUrl, {fetch});
            const items = getThingAll(myReadingList);
            items.forEach((item) => {
                myReadingList = removeThing(myReadingList, item);
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message); // Now you can safely access error.message
            } else {
                console.error("An unknown error occurred");
            }
        }

        titlesArray.forEach((title, index) => {
            let item = createThing({name: `title${index}`});
            item = addUrl(item, RDF.type, AS.Article);
            item = addStringNoLocale(item, SCHEMA_INRUPT.name, title);
            myReadingList = setThing(myReadingList, item);
        });

        try {
            await saveSolidDatasetAt(readingListUrl, myReadingList, {fetch});
            setStatus("Saved successfully!");

            const savedList = await getSolidDataset(readingListUrl, {fetch});
            const items = getThingAll(savedList);
            const retrievedTitles = items
                .map((item) => getStringNoLocale(item, SCHEMA_INRUPT.name))
                .filter((item) => item !== null)
                .join("\n");

            setSavedTitles(retrievedTitles);
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error}`);
        }
    };

    useEffect(() => {
        handleRedirectAfterLogin();
    }, []);

    return (
        <div className="grid items-center justify-items-center p-8 gap-2 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="text-left w-[600px]">
                <h1 className="text-xl font-bold mb-4">Solid Reading List</h1>

                <section className="">
                    <label>Select your Identity Provider (IdP):</label>
                    <select
                        value={idp}
                        onChange={handleIdpChange}
                        className="block border p-2 rounded text-gray-600"
                    >
                        <option value="">--Select an IdP--</option>
                        <option value="https://login.inrupt.com">Inrupt (PodSpaces)</option>
                    </select>
                    <button
                        onClick={handleLogin}
                        disabled={!idp}
                        className="mt-2 p-2 bg-blue-500 text-white rounded"
                    >
                        Login
                    </button>
                </section>
                <div className="my-4"/>
                {webID && (
                    <section>
                        <p>Logged in as: {webID}</p>
                        <button
                            onClick={handleGetPods}
                            className="mt-2 p-2 bg-green-500 text-white rounded"
                        >
                            Get Pod URLs
                        </button>
                    </section>
                )}
                <div className="my-4"/>
                {pods.length > 0 && (
                    <section>
                        <label>Select a Pod:</label>
                        <select
                            value={pod}
                            onChange={handlePodChange}
                            className="block border p-2 rounded text-gray-600"
                        >
                            <option value="">--Select a Pod--</option>
                            {pods.map((p, index) => (
                                <option key={index} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        getting-started/readingList/myList
                    </section>
                )}
                <div className="my-4"/>
                {pod && (
                    <section>
                        <label>Reading List Titles:</label>
                        <textarea
                            value={titles}
                            onChange={handleTitleChange}
                            className="block border p-2 rounded w-full text-gray-600"
                        />
                        <button
                            onClick={handleCreateList}
                            className="mt-2 p-2 bg-purple-500 text-white rounded"
                        >
                            Create List
                        </button>
                    </section>
                )}
                <div className="my-4"/>
                {status && <p>Status: {status}</p>}

                {savedTitles && (
                    <section>
                        <label>Retrieved Titles:</label>
                        <textarea
                            value={savedTitles}
                            readOnly
                            className="block border p-2 rounded w-full text-gray-600"
                        />
                    </section>
                )}
            </div>
            <footer className="text-center text-white text-sm mt-4">
                <p>
                    This is a solid application example of how to create a reading list using NextJS.
                </p>
                <p>
                    This code is available on
                    <a href="https://github.com/parkeugene/getting-started-solid-app/"> <Image src="/github-mark-white.png" alt="GitHub icon" width={20} height={20} className="inline"></Image> GitHub</a>
                </p>
            </footer>
        </div>
    );
}
