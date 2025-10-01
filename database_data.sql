--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: watches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.watches (id, watch_id, component_ids, image, location, "timestamp", assembler_address, distributor_address, available_for_sale, retailer_address, sold, current_owner, ownership_history, created_at, shipping_status, shipping_trail, updated_at, retail_price, retailer_timestamp, retailer_location, consumer_timestamp, last_transfer_timestamp, nft_token_id, nft_metadata_ipfs_hash, nft_image_ipfs_hash, nft_metadata_uri, nft_minted, nft_mint_timestamp, nft_image_uri, nft_generated) FROM stdin;
83	WATCH-1758140336861-9448	{COMP-1758138451224-9714,COMP-1758138370791-9014,COMP-1758138245475-4703}	1758140342834-test123.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758140336	0x69d94de55f33543f8155f2fed66f284b24e23a4d	0x443a065535748c5cbc6909f4bb215590252db072	f	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	{0x69d94de55f33543f8155f2fed66f284b24e23a4d,0x443a065535748c5cbc6909f4bb215590252db072,0x45c5bb5b481af7f950ae2ce4f82f52d848715f35,0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31,0x45c5bb5b481af7f950ae2ce4f82f52d848715f35}	2025-09-18 04:19:07.903447	3	{"SHIPPED at 2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia on 09/18/2025, 04:22:54 AM (ISO: 2025-09-17T20:22:54.879Z)","IN TRANSIT at 2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia on 09/18/2025, 04:24:32 AM (ISO: 2025-09-17T20:24:32.140Z)","DELIVERED at 2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia on 09/18/2025, 04:25:30 AM (ISO: 2025-09-17T20:25:30.373Z)"}	2025-09-18 05:10:14.530184	15000.00	2025-09-18 04:27:20.327+08	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	2025-09-18 04:31:56.317+08	2025-09-17 21:10:14.581	\N	\N	\N	ipfs://QmbMPvrSJRZybQNXh2ojfCMTKoAC3yFNt6MCJqsR2w2bie	f	\N	ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe	t
84	WATCH-1758235833449-4299	{COMP-1758235018435-7175,COMP-1758235114131-4331,COMP-1758235207493-0709}	1758235844142-test123.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758235833	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	\N	f	\N	f	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	{0x45c5bb5b481af7f950ae2ce4f82f52d848715f35}	2025-09-19 06:50:50.527003	0	{}	2025-09-19 06:50:50.527003	0.00	\N	\N	\N	\N	\N	\N	\N	ipfs://QmQp5AK6JoEaeqpQT4A2FoijgD1PVq8C4g24Yr99Ah9uHw	f	\N	ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe	t
86	WATCH-1758235946671-5052	{COMP-1758235018435-7175,COMP-1758235114131-4331,COMP-1758235207493-0709}	1758235958536-test123.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758235946	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	\N	f	\N	f	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	{0x45c5bb5b481af7f950ae2ce4f82f52d848715f35}	2025-09-19 06:52:42.785016	0	{}	2025-09-19 06:52:42.785016	0.00	\N	\N	\N	\N	\N	\N	\N	ipfs://QmX4F9dZqh1QB2VeUEUS32oa7YXb26Jw9QqfgkzxUoEtaQ	f	\N	ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe	t
87	WATCH-1758283178972-9342	{COMP-1758282855876-6470,COMP-1758282251632-5450,COMP-1758282149528-8088}	1758283192909-test1.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758283178	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	\N	f	\N	f	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	{0x45c5bb5b481af7f950ae2ce4f82f52d848715f35}	2025-09-19 20:01:54.943839	0	{}	2025-09-19 20:01:54.943839	0.00	\N	\N	\N	\N	\N	\N	\N	ipfs://QmbMWF8SjmeFrc7Quxxw4ndGBtA9rf5Hx84uyZusucxuLw	f	\N	http://localhost:5000/file/watch/1758283192909-test1.png	t
88	WATCH-1758283792734-7698	{COMP-1758282855876-6470,COMP-1758282251632-5450,COMP-1758282149528-8088,COMP-1758282149528-8088}	1758283801257-test123.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758283792	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	\N	f	\N	f	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	{0x45c5bb5b481af7f950ae2ce4f82f52d848715f35}	2025-09-19 20:10:20.326726	0	{}	2025-09-19 20:10:20.326726	0.00	\N	\N	\N	\N	\N	\N	\N	ipfs://Qmafz9HFaqetJqx7Rvth88nSb9Tg9PnTipV5nxbCYtnQ7T	f	\N	ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe	t
\.


--
-- Data for Name: aimodel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aimodel (id, watch_id, ai_analyzed, ai_watch_model, ai_market_price, ai_analysis_date, ai_confidence_score, created_at, updated_at, month1, month2, month3, month4, month5, month6, month7, month8, month9, month10, month11, month12, ai_trend_analysis, ai_recommendations, nft_metadata_uri, nft_image_uri) FROM stdin;
67	WATCH-1758140336861-9448	t	Rolex GMT-Master II 126720VTNR	24500.00	2025-09-18 04:33:37.506102	0.85	2025-09-18 04:19:07.946447	2025-09-18 04:33:37.506102	23800.00	23950.00	24100.00	24050.00	24200.00	24350.00	24400.00	24300.00	24450.00	24600.00	24550.00	24500.00	The Rolex GMT-Master II 126720VTNR shows an overall upward trend, increasing from $23800 in Oct-2024 to $24500 in Sep-2025. The highest price observed was $24600 in July-2025, while the lowest was the starting price of $23800. There has been a slight downward correction in the last two months after its peak.	It is a good time to Buy, as the recent minor dip after a year of consistent appreciation presents a favorable entry point for long-term investors. We predict the price will likely stabilize and then resume a moderate upward trend over the next three months, continuing its overall growth trajectory.	\N	\N
69	WATCH-1758235833449-4299	f	\N	\N	\N	\N	2025-09-19 06:50:50.577049	2025-09-19 06:50:50.577049	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N
70	WATCH-1758235946671-5052	f	\N	\N	\N	\N	2025-09-19 06:52:43.002115	2025-09-19 06:52:43.002115	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N
71	WATCH-1758283178972-9342	f	\N	\N	\N	\N	2025-09-19 20:01:54.972823	2025-09-19 20:01:54.972823	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N
72	WATCH-1758283792734-7698	f	\N	\N	\N	\N	2025-09-19 20:10:20.346111	2025-09-19 20:10:20.346111	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N
\.


--
-- Data for Name: raw_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raw_materials (id, component_id, material_type, origin, image, location, "timestamp", supplier_address, used, created_at) FROM stdin;
270	RM-1758138003749-2546	Sapphire Crystal	Austria	1758138015430-sapphire.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138003	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	f	2025-09-18 03:40:15.478343
269	RM-1758137880506-1793	Gold 18K	Switzerland	1758137892133-gold.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758137880	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	t	2025-09-18 03:38:12.315715
271	RM-1758138043223-5163	Platinum	Switzerland	1758138053601-platinium.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138043	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	t	2025-09-18 03:40:53.822249
272	RM-1758138157875-0767	Stainless Steel	Switzerland	1758138166814-stainless steel.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138157	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	t	2025-09-18 03:42:46.929695
273	RM-1758234703374-7550	Sapphire Crystal	Switzerland	1758234721531-sapphire.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758234703	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 06:32:01.638211
274	RM-1758234809323-5256	Gold 18K	Switzerland	1758234814732-gold.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758234809	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 06:33:35.140253
275	RM-1758234903801-0745	Stainless Steel	Switzerland	1758234912472-platinium.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758234903	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 06:35:12.615951
276	RM-1758281932275-3843	Gold 18K	Switzerland	1758281940257-gold.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758281932	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 19:39:00.374978
277	RM-1758282013913-9719	Gold 18K	Switzerland	1758282019582-sapphire.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758282013	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 19:40:19.846438
278	RM-1758282084620-1042	Gold 18K	Switzerland	1758282095100-titanium.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758282084	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	t	2025-09-19 19:41:35.238566
\.


--
-- Data for Name: components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.components (id, component_id, component_type, serial_number, raw_material_id, image, location, "timestamp", manufacturer_address, status, certifier_address, certifier_remarks, certifier_image, certify_timestamp, created_at, certifier_location) FROM stdin;
69	COMP-1758138451224-9714	Bezel	BEZEL-1758138517096-4195	RM-1758138157875-0767	1758138523621-bezel.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138451	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x443a065535748c5cbc6909f4bb215590252db072	Quality Assessment: Automatic movement operates within manufacturer’s stated accuracy of +3/-2 seconds per day. Rotor winds bi-directionally without unusual noise.\n\nInspection Results: Power reserve measured at 69 hours, slightly exceeding the official 68-hour specification.\n\nCompliance Notes: Movement tested under COSC chronometer certification conditions and passed all criteria.\n\nObservations: Regulation screws are intact and free from corrosion; no intervention required at this stage.	1758138718881-watch_certificate.jpg	1758138698	2025-09-18 03:48:43.809087	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
68	COMP-1758138370791-9014	Crown	CROWN-1758138376388-6306	RM-1758138043223-5163	1758138377280-crown.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138370	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x443a065535748c5cbc6909f4bb215590252db072	Quality Assessment: Automatic movement operates within manufacturer’s stated accuracy of +3/-2 seconds per day. Rotor winds bi-directionally without unusual noise.\n\nInspection Results: Power reserve measured at 69 hours, slightly exceeding the official 68-hour specification.\n\nCompliance Notes: Movement tested under COSC chronometer certification conditions and passed all criteria.\n\nObservations: Regulation screws are intact and free from corrosion; no intervention required at this stage.	1758138773434-watch_certificate.jpg	1758138764	2025-09-18 03:46:17.427901	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
67	COMP-1758138245475-4703	Movement	MOVEMENT-1758138245456-7917	RM-1758137880506-1793	1758138280140-movement.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758138245	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x443a065535748c5cbc6909f4bb215590252db072	Quality Assessment: Automatic movement operates within manufacturer’s stated accuracy of +3/-2 seconds per day. Rotor winds bi-directionally without unusual noise.\n\nInspection Results: Power reserve measured at 69 hours, slightly exceeding the official 68-hour specification.\n\nCompliance Notes: Movement tested under COSC chronometer certification conditions and passed all criteria.\n\nObservations: Regulation screws are intact and free from corrosion; no intervention required at this stage.	1758138863971-watch_certificate.jpg	1758138848	2025-09-18 03:44:40.381264	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
70	COMP-1758235018435-7175	Movement	MOVEMENT-1758235018427-9312	RM-1758234703374-7550	1758235029383-buckle.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758235018	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	q		1758235538	2025-09-19 06:37:09.801492	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
71	COMP-1758235114131-4331	Movement	MOVEMENT-1758235114123-0333	RM-1758234809323-5256	1758235118308-dial.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758235114	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	123		1758235490	2025-09-19 06:38:38.563916	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
72	COMP-1758235207493-0709	Movement	MOVEMENT-1758235207416-4222	RM-1758234903801-0745	1758235217979-crown.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758235207	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	avc	1758235419015-case.png	1758235403	2025-09-19 06:40:18.31735	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
75	COMP-1758282855876-6470	Movement	MOVEMENT-1758282855867-4036	RM-1758282084620-1042	1758282862014-crown.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758282855	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	1		1758282938	2025-09-19 19:54:22.166376	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
74	COMP-1758282251632-5450	Movement	MOVEMENT-1758282251623-8308	RM-1758282013913-9719	1758282256669-hands.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758282251	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	1		1758282998	2025-09-19 19:44:16.734702	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
73	COMP-1758282149528-8088	Movement	MOVEMENT-1758282149496-8076	RM-1758281932275-3843	1758282161070-dial.png	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia	1758282149	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	2	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	1		1758283063	2025-09-19 19:42:41.445201	2346, Jalan Seksyen 2/10, Kampar, Perak, Malaysia
\.


--
-- Data for Name: ipfs_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ipfs_cache (id, ipfs_hash, content_type, file_name, content, uploaded_at, last_accessed) FROM stdin;
1	QmUid6MrCSTaXiLnq4XUzfWhs4wbcXvKyaDXcTkWWXCeoR	text/plain	test.txt	Hello Pinata IPFS Test - 2025-08-30T18:43:56.485Z	2025-08-31 02:43:58.770219+08	2025-08-31 02:43:58.770219+08
3	Qmc1bdxbcS2AN5ThMp8i3gG1LFZNtajznAwBac9pRPwnmR	application/json	WATCH-1756580343015-4670-metadata.json	{\n  "name": "Luxury Watch #WATCH-1756580343015-4670",\n  "description": "Certified luxury timepiece with full supply chain traceability. 3 verified components with blockchain-verified authenticity.",\n  "image": "ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe",\n  "external_url": "https://yourapp.com/watch/WATCH-1756580343015-4670",\n  "attributes": [\n    {\n      "trait_type": "Assembly Date",\n      "value": "Invalid Date"\n    },\n    {\n      "trait_type": "Components Count",\n      "value": 3\n    },\n    {\n      "trait_type": "Assembler",\n      "value": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n    },\n    {\n      "trait_type": "Shipping Status",\n      "value": "Not Shipped"\n    }\n  ],\n  "supply_chain": {\n    "raw_materials": [\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      }\n    ],\n    "components": [\n      {\n        "component_id": "COMP-1756579956503-8397",\n        "component_type": "Movement",\n        "serial_number": "MOVEMENT-1756579956488-4866",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "component_id": "COMP-1756580010508-1108",\n        "component_type": "Hands",\n        "serial_number": "HANDS-1756580016259-9482",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "component_id": "COMP-1756580064323-9911",\n        "component_type": "Movement",\n        "serial_number": "MOVEMENT-1756580064090-1222",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      }\n    ],\n    "certifications": [\n      {\n        "component": "COMP-1756579956503-8397",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756580121",\n        "remarks": "1"\n      },\n      {\n        "component": "COMP-1756580010508-1108",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756580176",\n        "remarks": "2"\n      },\n      {\n        "component": "COMP-1756580064323-9911",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756580232",\n        "remarks": "3"\n      }\n    ],\n    "shipping_history": []\n  },\n  "metadata_version": "1.0",\n  "created_at": "2025-08-30T18:59:26.172Z",\n  "blockchain_data": {\n    "assembler": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n    "current_owner": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n    "ownership_history": [\n      "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n    ]\n  }\n}	2025-08-31 02:59:22.708715+08	2025-08-31 02:59:22.708715+08
2	QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe	image/jpeg	1756580362573-test123.png	\N	2025-08-31 02:59:22.708715+08	2025-08-31 12:56:40.664906+08
5	Qmc1EUGdSmb1joTxQKDyMhdx3MeySHYiWHC3Xh444wvPUE	application/json	WATCH-1756616188704-3325-metadata.json	{\n  "name": "Luxury Watch #WATCH-1756616188704-3325",\n  "description": "Certified luxury timepiece with full supply chain traceability. 3 verified components with blockchain-verified authenticity.",\n  "image": "ipfs://QmccwWoYvHaW1r4UfMvkpFSak9HyzACnwiuvWG1PQgjohe",\n  "external_url": "https://yourapp.com/watch/WATCH-1756616188704-3325",\n  "attributes": [\n    {\n      "trait_type": "Assembly Date",\n      "value": "Invalid Date"\n    },\n    {\n      "trait_type": "Components Count",\n      "value": 3\n    },\n    {\n      "trait_type": "Assembler",\n      "value": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n    },\n    {\n      "trait_type": "Shipping Status",\n      "value": "Not Shipped"\n    }\n  ],\n  "supply_chain": {\n    "raw_materials": [\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "material_type": "Gold 18K",\n        "origin": "Switzerland",\n        "supplier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      }\n    ],\n    "components": [\n      {\n        "component_id": "COMP-1756615725357-1449",\n        "component_type": "Movement",\n        "serial_number": "MOVEMENT-1756615725332-4620",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "component_id": "COMP-1756615780390-9463",\n        "component_type": "Movement",\n        "serial_number": "MOVEMENT-1756615780377-2328",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      },\n      {\n        "component_id": "COMP-1756615816245-6637",\n        "component_type": "Bezel",\n        "serial_number": "BEZEL-1756615822103-5457",\n        "manufacturer": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "certified": true,\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n      }\n    ],\n    "certifications": [\n      {\n        "component": "COMP-1756615725357-1449",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756615888",\n        "remarks": "123"\n      },\n      {\n        "component": "COMP-1756615780390-9463",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756615935",\n        "remarks": "Well"\n      },\n      {\n        "component": "COMP-1756615816245-6637",\n        "certifier": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n        "timestamp": "1756615984",\n        "remarks": "Good\\n"\n      }\n    ],\n    "shipping_history": []\n  },\n  "metadata_version": "1.0",\n  "created_at": "2025-08-31T04:56:47.442Z",\n  "blockchain_data": {\n    "assembler": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n    "current_owner": "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31",\n    "ownership_history": [\n      "0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31"\n    ]\n  }\n}	2025-08-31 12:56:40.664906+08	2025-08-31 12:56:40.664906+08
\.


--
-- Data for Name: nft_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nft_metadata (id, watch_id, ipfs_metadata_hash, ipfs_image_hash, token_id, minted_at, last_metadata_update, metadata_version, mint_transaction_hash, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ownership_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ownership_transfers (id, watch_id, from_address, to_address, transfer_type, transfer_timestamp, transfer_location, transaction_hash, notes, created_at) FROM stdin;
1	WATCH-1756312802354-5304	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	initial_purchase	2025-08-27 16:49:22.076	Consumer Purchase	\N	Initial consumer purchase	2025-08-28 00:49:22.200253
2	WATCH-1756312802354-5304	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	0x443a065535748c5cbc6909f4bb215590252db072	consumer_transfer	2025-08-27 16:51:28.845	Not specified	\N	Ownership transfer	2025-08-28 00:51:28.842585
3	WATCH-1757972205265-4840	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	initial_purchase	2025-09-16 10:48:09.264	Consumer Purchase	\N	Initial consumer purchase	2025-09-16 18:48:10.620193
4	WATCH-1758039619553-1751	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	0x69d94de55f33543f8155f2fed66f284b24e23a4d	initial_purchase	2025-09-16 19:04:29.59	Consumer Purchase	\N	Initial consumer purchase	2025-09-17 03:04:29.784412
5	WATCH-1758039619553-1751	0x69d94de55f33543f8155f2fed66f284b24e23a4d	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	consumer_transfer	2025-09-16 19:05:26.221	Not specified	\N	Ownership transfer	2025-09-17 03:05:26.201727
6	WATCH-1758051260502-0907	0x443a065535748c5cbc6909f4bb215590252db072	0x69d94de55f33543f8155f2fed66f284b24e23a4d	initial_purchase	2025-09-16 19:58:44.145	Consumer Purchase	\N	Initial consumer purchase	2025-09-17 03:58:44.209149
7	WATCH-1758051260502-0907	0x69d94de55f33543f8155f2fed66f284b24e23a4d	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	consumer_transfer	2025-09-16 20:21:13.61	Not specified	\N	Ownership transfer	2025-09-17 04:21:13.594659
8	WATCH-1758064440294-0965	0x443a065535748c5cbc6909f4bb215590252db072	0x69d94de55f33543f8155f2fed66f284b24e23a4d	initial_purchase	2025-09-17 01:19:17.522	Consumer Purchase	\N	Initial consumer purchase	2025-09-17 09:19:18.404451
9	WATCH-1758064440294-0965	0x69d94de55f33543f8155f2fed66f284b24e23a4d	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	consumer_transfer	2025-09-17 01:27:32.312	Not specified	\N	Ownership transfer	2025-09-17 09:27:32.298694
10	WATCH-1758103121615-4122	0x443a065535748c5cbc6909f4bb215590252db072	0x69d94de55f33543f8155f2fed66f284b24e23a4d	initial_purchase	2025-09-17 10:54:13.736	Consumer Purchase	\N	Initial consumer purchase	2025-09-17 18:54:13.86076
11	WATCH-1758103121615-4122	0x69d94de55f33543f8155f2fed66f284b24e23a4d	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	consumer_transfer	2025-09-17 19:20:52.311	Not specified	\N	Ownership transfer	2025-09-18 03:20:52.261522
12	WATCH-1758140336861-9448	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	initial_purchase	2025-09-17 20:31:56.317	Consumer Purchase	\N	Initial consumer purchase	2025-09-18 04:31:57.076457
13	WATCH-1758140336861-9448	0x8f6b3d3e26e4a7e79ab6af0fd63de43aa7b44a31	0x45c5bb5b481af7f950ae2ce4f82f52d848715f35	consumer_transfer	2025-09-17 21:10:14.581	Not specified	\N	Ownership transfer	2025-09-18 05:10:14.530184
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, name, description, website, location, image, email, phone, wallet_address, created_at, updated_at) FROM stdin;
1	admin	Admin-123	admin	Admin User	System Administrator	https://admin.example.com	Headquarters, City	admin.png	admin@company.com	+1-555-0001	0x1234567890abcdef1234567890abcdef12345678	2025-08-20 23:19:44.942985	2025-08-20 23:19:44.942985
3	manu	Admin-123	manufacturer	Precision Components Inc.	High-precision watch component manufacturing	https://precisioncomp.com	Manufacturing Hub, Tech City	1755714024904-manufacturer.png	orders@precisioncomp.com	+1-555-0004	\N	2025-08-21 02:20:25.100568	2025-08-21 02:20:25.100568
4	cert	Admin-123	certifier	Quality Assurance Bureau	Independent quality certification services	https://qualitybureau.org	Certification Center, Standards City	1755714135535-certifier.png	cert@qualitybureau.org	+1-555-0006	\N	2025-08-21 02:22:15.688863	2025-08-21 02:22:15.688863
5	ass	Admin-123	assembler	Elite Watch Assembly	Luxury watch assembly and finishing	https://eliteassembly.com	Assembly District, Craft City	1755714193008-assembler.png	production@eliteassembly.com	+1-555-0007	\N	2025-08-21 02:23:13.217514	2025-08-21 02:23:13.217514
6	dis	Admin-123	distributor	Global Watch Distribution	Worldwide luxury watch distribution network	https://globalwatchdist.com	Logistics Hub, Port City	1755714285545-distributor.png	logistics@globalwatchdist.com	+1-555-0009	\N	2025-08-21 02:24:45.764238	2025-08-21 02:24:45.764238
7	ret	Admin-123	retailer	Luxury Timepieces Boutique	Premium retail experience for luxury watches	https://luxurytimepieces.com	Fashion District, Metro City	1755714332939-retailer.png	sales@luxurytimepieces.com	+1-555-0010	\N	2025-08-21 02:25:33.104737	2025-08-21 02:25:33.104737
8	cons	Admin-123	consumer	John Smith	Watch collector and enthusiast		Residential Area, Suburb City	1755714673316-consumer.png	john.smith@email.com	+1-555-0012	\N	2025-08-21 02:31:13.936806	2025-08-21 02:31:13.936806
2	supp	Admin-123	supplier	Raw Materials Co.	Premium raw materials supplier for luxury watches	https://precisioncomp.com	Industrial District, Metal City	1755713914484-supplier.png	contact@rawmaterials.com	+1-555-0002	\N	2025-08-21 02:18:34.985316	2025-08-21 02:18:34.985316
9	Test1	Admin-123	supplier	Crystal Clear Ltd.	High-quality sapphire crystals for watchmaking	https://crystalclear.com	Gemstone Park, Quartz Valley	1755721459260-test2.png	sales@crystalclear.com	+1-555-3000	\N	2025-08-21 04:24:19.414554	2025-08-21 04:24:19.414554
\.


--
-- Name: aimodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aimodel_id_seq', 72, true);


--
-- Name: components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.components_id_seq', 75, true);


--
-- Name: ipfs_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ipfs_cache_id_seq', 5, true);


--
-- Name: nft_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nft_metadata_id_seq', 1, false);


--
-- Name: ownership_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ownership_transfers_id_seq', 13, true);


--
-- Name: raw_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raw_materials_id_seq', 278, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: watches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.watches_id_seq', 88, true);


--
-- PostgreSQL database dump complete
--

