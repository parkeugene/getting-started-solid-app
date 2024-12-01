'use client';
import { useEffect } from "react";
// Import from "@inrupt/solid-client-authn-browser"
import {
    login,
    handleIncomingRedirect,
    getDefaultSession,
    fetch
} from "@inrupt/solid-client-authn-browser";

// Import from "@inrupt/solid-client"
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

import { SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";

export default function Home() {

    useEffect(() => {
        const selectorIdP = document.querySelector("#select-idp");
        const selectorPod = document.querySelector("#select-pod");
        const buttonLogin = document.querySelector("#btnLogin");
        const buttonRead = document.querySelector("#btnRead");
        const buttonCreate = document.querySelector("#btnCreate");
        const labelCreateStatus = document.querySelector("#labelCreateStatus");

        if (buttonRead) {
            buttonRead.setAttribute("disabled", "disabled");
        }
        if (buttonLogin) {
            buttonLogin.setAttribute("disabled", "disabled");
        }
        if (buttonCreate) {
            buttonCreate.setAttribute("disabled", "disabled");
        }
//      buttonRead.setAttribute("disabled", "disabled");
//      buttonLogin.setAttribute("disabled", "disabled");
//      buttonCreate.setAttribute("disabled", "disabled");

// 1a. Start Login Process. Call login() function.
        function loginToSelectedIdP() {
            const SELECTED_IDP = document.getElementById("select-idp").value;

            return login({
                oidcIssuer: SELECTED_IDP,
                redirectUrl: new URL("/", window.location.href).toString(),
                clientName: "Getting started app"
            });
        }

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
        async function handleRedirectAfterLogin() {
            await handleIncomingRedirect(); // no-op if not part of login redirect

            const session = getDefaultSession();
            if (session.info.isLoggedIn) {
                // Update the page with the status.
                document.getElementById("myWebID").value = session.info.webId;

                // Enable Read button to read Pod URL
                buttonRead.removeAttribute("disabled");
            }
        }

// The example has the login redirect back to the root page.
// The page calls this method, which, in turn, calls handleIncomingRedirect.
        handleRedirectAfterLogin();

// 2. Get Pod(s) associated with the WebID
        async function getMyPods() {
            const webID = document.getElementById("myWebID").value;
            const mypods = await getPodUrlAll(webID, { fetch: fetch });

            // Update the page with the retrieved values.

            mypods.forEach((mypod) => {
                const podOption = document.createElement("option");
                podOption.textContent = mypod;
                podOption.value = mypod;
                selectorPod.appendChild(podOption);
            });
        }

// 3. Create the Reading List
        async function createList() {
            labelCreateStatus.textContent = "";
            const SELECTED_POD = document.getElementById("select-pod").value;

            // For simplicity and brevity, this tutorial hardcodes the  SolidDataset URL.
            // In practice, you should add in your profile a link to this resource
            // such that applications can follow to find your list.
            const readingListUrl = `${SELECTED_POD}getting-started/readingList/myList`;

            const titles = document.getElementById("titles").value.split("\n");

            // Fetch or create a new reading list.
            let myReadingList;

            try {
                // Attempt to retrieve the reading list in case it already exists.
                myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });
                // Clear the list to override the whole list
                const items = getThingAll(myReadingList);
                items.forEach((item) => {
                    myReadingList = removeThing(myReadingList, item);
                });
            } catch (error) {
                if (typeof error.statusCode === "number" && error.statusCode === 404) {
                    // if not found, create a new SolidDataset (i.e., the reading list)
                    myReadingList = createSolidDataset();
                } else {
                    console.error(error.message);
                }
            }

            // Add titles to the Dataset
            let i = 0;
            titles.forEach((title) => {
                if (title.trim() !== "") {
                    let item = createThing({ name: "title" + i });
                    item = addUrl(item, RDF.type, AS.Article);
                    item = addStringNoLocale(item, SCHEMA_INRUPT.name, title);
                    myReadingList = setThing(myReadingList, item);
                    i++;
                }
            });

            try {
                // Save the SolidDataset
                let savedReadingList = await saveSolidDatasetAt(
                    readingListUrl,
                    myReadingList,
                    { fetch: fetch }
                );

                labelCreateStatus.textContent = "Saved";

                // Refetch the Reading List
                savedReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });

                const items = getThingAll(savedReadingList);

                let listcontent = "";
                for (let i = 0; i < items.length; i++) {
                    const item = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
                    if (item !== null) {
                        listcontent += item + "\n";
                    }
                }

                document.getElementById("savedtitles").value = listcontent;
            } catch (error) {
                console.log(error);
                labelCreateStatus.textContent = "Error" + error;
                labelCreateStatus.setAttribute("role", "alert");
            }
        }

        buttonLogin.onclick = function () {
            loginToSelectedIdP();
        };

        buttonRead.onclick = function () {
            getMyPods();
        };

        buttonCreate.onclick = function () {
            createList();
        };

        selectorIdP.addEventListener("change", idpSelectionHandler);
        function idpSelectionHandler() {
            if (selectorIdP.value === "") {
                buttonLogin.setAttribute("disabled", "disabled");
            } else {
                buttonLogin.removeAttribute("disabled");
            }
        }

        selectorPod.addEventListener("change", podSelectionHandler);
        function podSelectionHandler() {
            if (selectorPod.value === "") {
                buttonCreate.setAttribute("disabled", "disabled");
            } else {
                buttonCreate.removeAttribute("disabled");
            }
        }
    }, []);

    return (
        <div
            className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <section id="login" className="panel">
                    <label id="labelIdP" className="block mb-2 text-lg font-medium text-white dark:text-white">1. Select your Identity Provider: </label>
                    <div className="flex items-center space-x-2">
                        <select id="select-idp" name="select-idp" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                            <option value="">--Please select an Identity Provider (IdP)--</option>
                            <option value="https://login.inrupt.com">https://login.inrupt.com (PodSpaces)</option>
                        </select>
                        <button name="btnLogin" id="btnLogin" className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Login</button>
                    </div>
                </section>

                <div id="read" className="panel">
                    <label id="readlabel" htmlFor="myWebID" className="block mb-2 text-lg font-medium text-white dark:text-white">2. Logged in with your WebID: </label>
                    <div className="flex items-center space-x-2">
                        <input type="text" id="myWebID" name="myWebID" size="60" className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" disabled/>
                        <button name="btnRead" id="btnRead" className="mt-2 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Get Pod URL(s)</button>
                    </div>
                </div>

                <div id="write" className="panel">
                    <div className="row">
                        <label id="writelabel" className="block mb-2 text-lg font-medium text-white dark:text-white">3.Create a private reading list in my Pod.</label>
                    </div>
                    <div className="row">
                        <div>
                            <label id="podlabel" htmlFor="select-pod" className="block mb-2 font-medium text-white dark:text-white">a. Write to your Pod: </label>

                            <select id="select-pod" name="select-pod" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                <option value="">--Please select your Pod--</option>
                            </select>
                            getting-started/readingList/myList
                        </div>
                    </div>
                    <div className="row mt-4">
                        <div>
                            <label id="listLabel" htmlFor="titles" className="block mb-2 font-medium text-white dark:text-white">b. Enter items to read: </label>
                            <textarea id="titles" name="titles" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      defaultValue={`Leaves of Grass\nRDF 1.1 Primer`} />
                            <button name="btnCreate" id="btnCreate" className="mt-2 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Create</button>
                        </div>
                    </div>
                </div>
                <div id="results" className="panel">
                    <div className="row">
                        <label className="block mb-2 text-lg font-medium text-white dark:text-white">Create Reading List Status</label>
                        <span id="labelCreateStatus"></span>
                    </div>
                    <div className="row">
                        <div>
                            <label id="labelRetrieved" htmlFor="savedtitles">Retrieved to validate:</label>
                            <textarea id="savedtitles" name="savedtitles" rows="5" cols="42" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" disabled></textarea>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                This code is available on <a href="#" className="text-blue-500 dark:text-blue-300">GitHub</a>
            </footer>
        </div>
    );
}
