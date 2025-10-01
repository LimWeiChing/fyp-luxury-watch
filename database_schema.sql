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
-- Name: component_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.component_status AS ENUM (
    '0',
    '1',
    '2'
);


ALTER TYPE public.component_status OWNER TO postgres;

--
-- Name: shipping_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.shipping_status AS ENUM (
    '0',
    '1',
    '2',
    '3'
);


ALTER TYPE public.shipping_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'supplier',
    'manufacturer',
    'certifier',
    'assembler',
    'distributor',
    'retailer',
    'consumer'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: get_next_token_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_next_token_id() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    next_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_id), 0) + 1 INTO next_id FROM nft_tokens;
    RETURN next_id;
END;
$$;


ALTER FUNCTION public.get_next_token_id() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aimodel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aimodel (
    id integer NOT NULL,
    watch_id character varying(255) NOT NULL,
    ai_analyzed boolean DEFAULT false,
    ai_watch_model text,
    ai_market_price numeric(15,2),
    ai_analysis_date timestamp without time zone,
    ai_confidence_score numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    month1 numeric(15,2) DEFAULT 0,
    month2 numeric(15,2) DEFAULT 0,
    month3 numeric(15,2) DEFAULT 0,
    month4 numeric(15,2) DEFAULT 0,
    month5 numeric(15,2) DEFAULT 0,
    month6 numeric(15,2) DEFAULT 0,
    month7 numeric(15,2) DEFAULT 0,
    month8 numeric(15,2) DEFAULT 0,
    month9 numeric(15,2) DEFAULT 0,
    month10 numeric(15,2) DEFAULT 0,
    month11 numeric(15,2) DEFAULT 0,
    month12 numeric(15,2) DEFAULT 0,
    ai_trend_analysis text,
    ai_recommendations text,
    nft_metadata_uri text,
    nft_image_uri text
);


ALTER TABLE public.aimodel OWNER TO postgres;

--
-- Name: aimodel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aimodel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aimodel_id_seq OWNER TO postgres;

--
-- Name: aimodel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aimodel_id_seq OWNED BY public.aimodel.id;


--
-- Name: components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.components (
    id integer NOT NULL,
    component_id character varying(100) NOT NULL,
    component_type character varying(100) NOT NULL,
    serial_number character varying(100) NOT NULL,
    raw_material_id character varying(100),
    image character varying(255),
    location text,
    "timestamp" character varying(50),
    manufacturer_address character varying(42),
    status public.component_status DEFAULT '0'::public.component_status,
    certifier_address character varying(42),
    certifier_remarks text,
    certifier_image character varying(255),
    certify_timestamp character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    certifier_location text
);


ALTER TABLE public.components OWNER TO postgres;

--
-- Name: components_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.components_id_seq OWNER TO postgres;

--
-- Name: components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.components_id_seq OWNED BY public.components.id;


--
-- Name: ipfs_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ipfs_cache (
    id integer NOT NULL,
    ipfs_hash character varying(255) NOT NULL,
    content_type character varying(100),
    file_name character varying(255),
    content text,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_accessed timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ipfs_cache OWNER TO postgres;

--
-- Name: ipfs_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ipfs_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ipfs_cache_id_seq OWNER TO postgres;

--
-- Name: ipfs_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ipfs_cache_id_seq OWNED BY public.ipfs_cache.id;


--
-- Name: nft_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nft_metadata (
    id integer NOT NULL,
    watch_id character varying(255) NOT NULL,
    ipfs_metadata_hash character varying(255),
    ipfs_image_hash character varying(255),
    token_id integer,
    minted_at timestamp with time zone,
    last_metadata_update timestamp with time zone,
    metadata_version integer DEFAULT 1,
    mint_transaction_hash character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nft_metadata OWNER TO postgres;

--
-- Name: nft_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nft_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nft_metadata_id_seq OWNER TO postgres;

--
-- Name: nft_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nft_metadata_id_seq OWNED BY public.nft_metadata.id;


--
-- Name: ownership_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ownership_transfers (
    id integer NOT NULL,
    watch_id character varying(255) NOT NULL,
    from_address character varying(255) NOT NULL,
    to_address character varying(255) NOT NULL,
    transfer_type character varying(50) DEFAULT 'consumer_transfer'::character varying NOT NULL,
    transfer_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    transfer_location character varying(255) DEFAULT 'Not specified'::character varying,
    transaction_hash character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ownership_transfers OWNER TO postgres;

--
-- Name: ownership_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ownership_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ownership_transfers_id_seq OWNER TO postgres;

--
-- Name: ownership_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ownership_transfers_id_seq OWNED BY public.ownership_transfers.id;


--
-- Name: raw_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_materials (
    id integer NOT NULL,
    component_id character varying(100) NOT NULL,
    material_type character varying(100) NOT NULL,
    origin character varying(100) NOT NULL,
    image character varying(255),
    location text,
    "timestamp" character varying(50),
    supplier_address character varying(42),
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.raw_materials OWNER TO postgres;

--
-- Name: raw_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raw_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raw_materials_id_seq OWNER TO postgres;

--
-- Name: raw_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raw_materials_id_seq OWNED BY public.raw_materials.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    name character varying(255),
    description text,
    website character varying(255),
    location character varying(255),
    image character varying(255),
    email character varying(255),
    phone character varying(50),
    wallet_address character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: watches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watches (
    id integer NOT NULL,
    watch_id character varying(100) NOT NULL,
    component_ids character varying(100)[] NOT NULL,
    image character varying(255),
    location text,
    "timestamp" character varying(50),
    assembler_address character varying(42),
    distributor_address character varying(42),
    available_for_sale boolean DEFAULT false,
    retailer_address character varying(50),
    sold boolean DEFAULT false,
    current_owner character varying(42),
    ownership_history character varying(42)[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipping_status integer DEFAULT 0,
    shipping_trail text[] DEFAULT ARRAY[]::text[],
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    retail_price numeric(15,2) DEFAULT 0,
    retailer_timestamp timestamp with time zone,
    retailer_location character varying(255),
    consumer_timestamp timestamp with time zone,
    last_transfer_timestamp timestamp without time zone,
    nft_token_id integer,
    nft_metadata_ipfs_hash text,
    nft_image_ipfs_hash text,
    nft_metadata_uri text,
    nft_minted boolean DEFAULT false,
    nft_mint_timestamp timestamp with time zone,
    nft_image_uri text,
    nft_generated boolean DEFAULT false
);


ALTER TABLE public.watches OWNER TO postgres;

--
-- Name: watches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.watches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watches_id_seq OWNER TO postgres;

--
-- Name: watches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.watches_id_seq OWNED BY public.watches.id;


--
-- Name: aimodel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aimodel ALTER COLUMN id SET DEFAULT nextval('public.aimodel_id_seq'::regclass);


--
-- Name: components id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.components ALTER COLUMN id SET DEFAULT nextval('public.components_id_seq'::regclass);


--
-- Name: ipfs_cache id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ipfs_cache ALTER COLUMN id SET DEFAULT nextval('public.ipfs_cache_id_seq'::regclass);


--
-- Name: nft_metadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_metadata ALTER COLUMN id SET DEFAULT nextval('public.nft_metadata_id_seq'::regclass);


--
-- Name: ownership_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ownership_transfers ALTER COLUMN id SET DEFAULT nextval('public.ownership_transfers_id_seq'::regclass);


--
-- Name: raw_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials ALTER COLUMN id SET DEFAULT nextval('public.raw_materials_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: watches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watches ALTER COLUMN id SET DEFAULT nextval('public.watches_id_seq'::regclass);


--
-- Name: aimodel aimodel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aimodel
    ADD CONSTRAINT aimodel_pkey PRIMARY KEY (id);


--
-- Name: aimodel aimodel_watch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aimodel
    ADD CONSTRAINT aimodel_watch_id_key UNIQUE (watch_id);


--
-- Name: components components_component_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_component_id_key UNIQUE (component_id);


--
-- Name: components components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_pkey PRIMARY KEY (id);


--
-- Name: ipfs_cache ipfs_cache_ipfs_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ipfs_cache
    ADD CONSTRAINT ipfs_cache_ipfs_hash_key UNIQUE (ipfs_hash);


--
-- Name: ipfs_cache ipfs_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ipfs_cache
    ADD CONSTRAINT ipfs_cache_pkey PRIMARY KEY (id);


--
-- Name: nft_metadata nft_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_metadata
    ADD CONSTRAINT nft_metadata_pkey PRIMARY KEY (id);


--
-- Name: nft_metadata nft_metadata_watch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_metadata
    ADD CONSTRAINT nft_metadata_watch_id_key UNIQUE (watch_id);


--
-- Name: ownership_transfers ownership_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ownership_transfers
    ADD CONSTRAINT ownership_transfers_pkey PRIMARY KEY (id);


--
-- Name: raw_materials raw_materials_component_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_component_id_key UNIQUE (component_id);


--
-- Name: raw_materials raw_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: watches watches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watches
    ADD CONSTRAINT watches_pkey PRIMARY KEY (id);


--
-- Name: watches watches_watch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watches
    ADD CONSTRAINT watches_watch_id_key UNIQUE (watch_id);


--
-- Name: idx_aimodel_watch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aimodel_watch_id ON public.aimodel USING btree (watch_id);


--
-- Name: idx_components_component_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_component_id ON public.components USING btree (component_id);


--
-- Name: idx_components_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_status ON public.components USING btree (status);


--
-- Name: idx_components_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_type ON public.components USING btree (component_type);


--
-- Name: idx_nft_metadata_token_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nft_metadata_token_id ON public.nft_metadata USING btree (token_id);


--
-- Name: idx_nft_metadata_watch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nft_metadata_watch_id ON public.nft_metadata USING btree (watch_id);


--
-- Name: idx_ownership_transfers_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ownership_transfers_timestamp ON public.ownership_transfers USING btree (transfer_timestamp DESC);


--
-- Name: idx_ownership_transfers_watch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ownership_transfers_watch_id ON public.ownership_transfers USING btree (watch_id);


--
-- Name: idx_raw_materials_component_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_materials_component_id ON public.raw_materials USING btree (component_id);


--
-- Name: idx_raw_materials_material_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_materials_material_type ON public.raw_materials USING btree (material_type);


--
-- Name: idx_raw_materials_origin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_materials_origin ON public.raw_materials USING btree (origin);


--
-- Name: idx_watches_current_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_current_owner ON public.watches USING btree (current_owner);


--
-- Name: idx_watches_last_transfer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_last_transfer ON public.watches USING btree (last_transfer_timestamp DESC);


--
-- Name: idx_watches_nft_generated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_nft_generated ON public.watches USING btree (nft_generated);


--
-- Name: idx_watches_nft_token_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_nft_token_id ON public.watches USING btree (nft_token_id);


--
-- Name: idx_watches_shipping_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_shipping_status ON public.watches USING btree (shipping_status);


--
-- Name: idx_watches_watch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_watches_watch_id ON public.watches USING btree (watch_id);


--
-- Name: watches update_watches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_watches_updated_at BEFORE UPDATE ON public.watches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: aimodel aimodel_watch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aimodel
    ADD CONSTRAINT aimodel_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(watch_id) ON DELETE CASCADE;


--
-- Name: components components_raw_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(component_id);


--
-- Name: nft_metadata nft_metadata_watch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_metadata
    ADD CONSTRAINT nft_metadata_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(watch_id);


--
-- PostgreSQL database dump complete
--

