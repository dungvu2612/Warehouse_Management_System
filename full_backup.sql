--
-- PostgreSQL database dump
--

\restrict HGW6upRc2qbclWXAK1fbCblXCnRltgtWZ6encOaVnG6nFbrvMqbtwOqj1Q8DJu1

-- Dumped from database version 17.10 (Postgres.app)
-- Dumped by pg_dump version 17.10 (Postgres.app)

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
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PICKING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: picking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.picking_status AS ENUM (
    'WAITING',
    'PICKING',
    'DONE'
);


ALTER TYPE public.picking_status OWNER TO postgres;

--
-- Name: stock_transaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.stock_transaction_type AS ENUM (
    'IMPORT',
    'EXPORT',
    'ADJUST',
    'ROLLBACK'
);


ALTER TYPE public.stock_transaction_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'STAFF'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bom_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom_items (
    id bigint NOT NULL,
    bom_id bigint NOT NULL,
    component_product_id bigint NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT bom_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.bom_items OWNER TO postgres;

--
-- Name: bom_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_items_id_seq OWNER TO postgres;

--
-- Name: bom_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_items_id_seq OWNED BY public.bom_items.id;


--
-- Name: boms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boms (
    id bigint NOT NULL,
    product_id bigint NOT NULL,
    bom_name character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE public.boms OWNER TO postgres;

--
-- Name: boms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.boms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.boms_id_seq OWNER TO postgres;

--
-- Name: boms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.boms_id_seq OWNED BY public.boms.id;


--
-- Name: import_receipt_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_receipt_items (
    id bigint NOT NULL,
    receipt_id bigint,
    product_id bigint,
    tray_id bigint,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    rfid_code character varying(255),
    scan_method character varying(30),
    actual_quantity integer DEFAULT 0 NOT NULL,
    actual_tray_id bigint,
    status character varying(30) DEFAULT 'WAITING'::character varying NOT NULL,
    assigned_to bigint,
    assigned_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT import_receipt_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.import_receipt_items OWNER TO postgres;

--
-- Name: import_receipt_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_receipt_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_receipt_items_id_seq OWNER TO postgres;

--
-- Name: import_receipt_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_receipt_items_id_seq OWNED BY public.import_receipt_items.id;


--
-- Name: import_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_receipts (
    id bigint NOT NULL,
    receipt_code character varying(100) NOT NULL,
    supplier_name character varying(255),
    note text,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    status character varying(30) DEFAULT 'POSTED'::character varying NOT NULL,
    review_status character varying(30) DEFAULT 'NEED_REVIEW'::character varying NOT NULL,
    posted_by bigint,
    posted_at timestamp with time zone,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    review_note text DEFAULT ''::text,
    CONSTRAINT import_receipts_review_status_check CHECK (((review_status)::text = ANY ((ARRAY['NEED_REVIEW'::character varying, 'REVIEWED'::character varying, 'HAS_ISSUE'::character varying])::text[]))),
    CONSTRAINT import_receipts_status_check CHECK (((status)::text = ANY ((ARRAY['WAITING'::character varying, 'PROCESSING'::character varying, 'COMPLETED'::character varying])::text[])))
);


ALTER TABLE public.import_receipts OWNER TO postgres;

--
-- Name: import_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_receipts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_receipts_id_seq OWNER TO postgres;

--
-- Name: import_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_receipts_id_seq OWNED BY public.import_receipts.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    id bigint NOT NULL,
    product_id bigint NOT NULL,
    tray_id bigint NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT inventory_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    location_code character varying(100) NOT NULL,
    shelf character varying(50),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_code character varying(100) NOT NULL,
    customer_name character varying(255),
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    total_amount numeric(15,2) DEFAULT 0,
    qr_code text NOT NULL,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    customer_phone character varying(50),
    customer_address text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: pick_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pick_logs (
    id bigint NOT NULL,
    picking_task_id bigint,
    order_id bigint,
    product_id bigint,
    tray_id bigint,
    picked_quantity integer NOT NULL,
    picked_by bigint,
    picked_at timestamp without time zone DEFAULT now(),
    note text,
    CONSTRAINT pick_logs_picked_quantity_check CHECK ((picked_quantity > 0))
);


ALTER TABLE public.pick_logs OWNER TO postgres;

--
-- Name: pick_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pick_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pick_logs_id_seq OWNER TO postgres;

--
-- Name: pick_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pick_logs_id_seq OWNED BY public.pick_logs.id;


--
-- Name: picking_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.picking_tasks (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    tray_id bigint NOT NULL,
    required_quantity integer NOT NULL,
    picked_quantity integer DEFAULT 0,
    verified boolean DEFAULT false,
    status public.picking_status DEFAULT 'WAITING'::public.picking_status,
    assigned_to bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    assigned_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT picking_tasks_picked_quantity_check CHECK ((picked_quantity >= 0)),
    CONSTRAINT picking_tasks_required_quantity_check CHECK ((required_quantity > 0))
);


ALTER TABLE public.picking_tasks OWNER TO postgres;

--
-- Name: picking_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.picking_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.picking_tasks_id_seq OWNER TO postgres;

--
-- Name: picking_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.picking_tasks_id_seq OWNED BY public.picking_tasks.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    product_code character varying(100) NOT NULL,
    product_name character varying(255) NOT NULL,
    description text,
    unit character varying(50) DEFAULT 'pcs'::character varying,
    min_stock integer DEFAULT 0,
    price numeric(15,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    product_type character varying(30) DEFAULT 'COMPONENT'::character varying NOT NULL,
    image_url text,
    qr_code character varying(100) NOT NULL,
    rfid_code character varying(255),
    CONSTRAINT products_product_type_check CHECK (((product_type)::text = ANY ((ARRAY['COMPONENT'::character varying, 'FINISHED_GOOD'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: putaway_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.putaway_requests (
    id bigint NOT NULL,
    product_qr_code character varying(100) NOT NULL,
    tray_qr_code character varying(100) NOT NULL,
    quantity integer NOT NULL,
    note text DEFAULT ''::text,
    reference_code character varying(100) DEFAULT ''::character varying,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    requested_by bigint,
    approved_by bigint,
    approved_at timestamp with time zone,
    reject_reason text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT putaway_requests_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT putaway_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.putaway_requests OWNER TO postgres;

--
-- Name: putaway_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.putaway_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.putaway_requests_id_seq OWNER TO postgres;

--
-- Name: putaway_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.putaway_requests_id_seq OWNED BY public.putaway_requests.id;


--
-- Name: rfid_audit_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_audit_items (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    epc_code character varying(255) NOT NULL,
    product_id bigint,
    registered_tray_id bigint,
    expected_tray_id bigint,
    scanned_tray_id bigint,
    result_type character varying(50) NOT NULL,
    action_status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfid_audit_items OWNER TO postgres;

--
-- Name: rfid_audit_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_audit_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_audit_items_id_seq OWNER TO postgres;

--
-- Name: rfid_audit_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_audit_items_id_seq OWNED BY public.rfid_audit_items.id;


--
-- Name: rfid_audit_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_audit_sessions (
    id bigint NOT NULL,
    session_code character varying(80) NOT NULL,
    location_id bigint,
    tray_id bigint,
    scanned_by bigint,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    total_scanned integer DEFAULT 0 NOT NULL,
    matched_count integer DEFAULT 0 NOT NULL,
    wrong_location_count integer DEFAULT 0 NOT NULL,
    unregistered_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);


ALTER TABLE public.rfid_audit_sessions OWNER TO postgres;

--
-- Name: rfid_audit_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_audit_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_audit_sessions_id_seq OWNER TO postgres;

--
-- Name: rfid_audit_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_audit_sessions_id_seq OWNED BY public.rfid_audit_sessions.id;


--
-- Name: rfid_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_tags (
    id bigint NOT NULL,
    epc_code character varying(255) NOT NULL,
    target_type character varying(50) NOT NULL,
    product_id bigint,
    tray_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    note text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfid_tags OWNER TO postgres;

--
-- Name: rfid_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_tags_id_seq OWNER TO postgres;

--
-- Name: rfid_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_tags_id_seq OWNED BY public.rfid_tags.id;


--
-- Name: stock_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_transactions (
    id bigint NOT NULL,
    transaction_type public.stock_transaction_type NOT NULL,
    product_id bigint NOT NULL,
    tray_id bigint,
    quantity integer NOT NULL,
    before_quantity integer NOT NULL,
    after_quantity integer NOT NULL,
    reference_code character varying(100),
    note text,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now(),
    scan_method character varying(30),
    scanned_code text,
    audit_session_id bigint
);


ALTER TABLE public.stock_transactions OWNER TO postgres;

--
-- Name: stock_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transactions_id_seq OWNER TO postgres;

--
-- Name: stock_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_transactions_id_seq OWNED BY public.stock_transactions.id;


--
-- Name: trays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trays (
    id bigint NOT NULL,
    tray_code character varying(100) NOT NULL,
    product_id bigint NOT NULL,
    location_id bigint NOT NULL,
    qr_code text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    rfid_code character varying(255)
);


ALTER TABLE public.trays OWNER TO postgres;

--
-- Name: trays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trays_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trays_id_seq OWNER TO postgres;

--
-- Name: trays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trays_id_seq OWNED BY public.trays.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    full_name character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role public.user_role DEFAULT 'STAFF'::public.user_role NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
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
-- Name: bom_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items ALTER COLUMN id SET DEFAULT nextval('public.bom_items_id_seq'::regclass);


--
-- Name: boms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boms ALTER COLUMN id SET DEFAULT nextval('public.boms_id_seq'::regclass);


--
-- Name: import_receipt_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipt_items ALTER COLUMN id SET DEFAULT nextval('public.import_receipt_items_id_seq'::regclass);


--
-- Name: import_receipts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts ALTER COLUMN id SET DEFAULT nextval('public.import_receipts_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: pick_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs ALTER COLUMN id SET DEFAULT nextval('public.pick_logs_id_seq'::regclass);


--
-- Name: picking_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks ALTER COLUMN id SET DEFAULT nextval('public.picking_tasks_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: putaway_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.putaway_requests ALTER COLUMN id SET DEFAULT nextval('public.putaway_requests_id_seq'::regclass);


--
-- Name: rfid_audit_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_audit_items ALTER COLUMN id SET DEFAULT nextval('public.rfid_audit_items_id_seq'::regclass);


--
-- Name: rfid_audit_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_audit_sessions ALTER COLUMN id SET DEFAULT nextval('public.rfid_audit_sessions_id_seq'::regclass);


--
-- Name: rfid_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags ALTER COLUMN id SET DEFAULT nextval('public.rfid_tags_id_seq'::regclass);


--
-- Name: stock_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transactions ALTER COLUMN id SET DEFAULT nextval('public.stock_transactions_id_seq'::regclass);


--
-- Name: trays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays ALTER COLUMN id SET DEFAULT nextval('public.trays_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: bom_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bom_items (id, bom_id, component_product_id, quantity, created_at, updated_at) FROM stdin;
1	1	12	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
2	1	13	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
3	1	16	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
4	1	26	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
5	1	28	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
6	1	30	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
7	2	12	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
8	2	14	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
9	2	16	3	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
10	2	31	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
11	2	32	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
12	2	33	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
13	3	12	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
14	3	13	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
15	3	26	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
16	3	52	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
17	3	56	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
18	3	59	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
19	4	11	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
20	4	17	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
21	4	18	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
22	4	27	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
23	4	53	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
24	4	54	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
25	5	11	4	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
26	5	17	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
27	5	18	2	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
28	5	27	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
29	5	31	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
30	5	53	1	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409
31	6	15	2	2026-06-04 16:36:37.118256	2026-06-04 16:36:37.118256
32	6	56	2	2026-06-04 16:36:37.118256	2026-06-04 16:36:37.118256
33	6	12	2	2026-06-04 16:36:37.118256	2026-06-04 16:36:37.118256
34	6	39	3	2026-06-04 16:36:37.118256	2026-06-04 16:36:37.118256
35	7	11	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
36	7	12	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
37	7	13	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
38	7	49	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
39	7	46	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
40	7	30	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
41	7	32	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
42	7	35	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
43	7	57	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
44	7	25	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
45	7	29	1	2026-06-06 14:34:36.699628	2026-06-06 14:34:36.699628
\.


--
-- Data for Name: boms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.boms (id, product_id, bom_name, description, created_at, updated_at, created_by) FROM stdin;
1	1	BOM DEMO MK-001	BOM demo cho Máy khâu gia đình cơ bản	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409	\N
2	2	BOM DEMO MK-002	BOM demo cho Máy khâu gia đình đa năng	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409	\N
3	3	BOM DEMO MK-003	BOM demo cho Máy khâu mini để bàn	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409	\N
4	4	BOM DEMO MK-004	BOM demo cho Máy khâu công nghiệp 1 kim	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409	\N
5	5	BOM DEMO MK-005	BOM demo cho Máy khâu công nghiệp 2 kim	2026-05-30 11:43:17.907409	2026-05-30 11:43:17.907409	\N
6	1	Máy khâu gia đình cơ bản	Máy khâu gia đình cơ bản	2026-06-04 16:36:37.114786	2026-06-04 16:36:37.114786	1
7	10	dfdsf		2026-06-06 14:34:36.69672	2026-06-06 14:34:36.69672	1
\.


--
-- Data for Name: import_receipt_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_receipt_items (id, receipt_id, product_id, tray_id, quantity, created_at, updated_at, rfid_code, scan_method, actual_quantity, actual_tray_id, status, assigned_to, assigned_at, completed_at) FROM stdin;
11	6	49	\N	14	2026-06-10 10:14:44.699993	2026-06-10 10:23:06.302331	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:23:06.302056+07	\N
3	1	13	\N	50	2026-05-30 11:43:52.841743	2026-06-10 10:23:28.689076	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:23:28.689028+07	\N
1	1	11	15	200	2026-05-30 11:43:52.841743	2026-06-10 10:24:42.509923	\N	\N	200	15	DONE	2	2026-06-10 10:23:26.018682+07	2026-06-10 10:24:42.509525+07
2	1	12	17	200	2026-05-30 11:43:52.841743	2026-06-10 10:26:35.716027	\N	\N	200	17	DONE	2	2026-06-10 10:25:54.666701+07	2026-06-10 10:26:35.715976+07
8	3	53	\N	20	2026-05-30 11:43:52.841743	2026-06-10 10:29:14.995591	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:29:14.995472+07	\N
7	3	51	\N	15	2026-05-30 11:43:52.841743	2026-06-10 10:29:18.158056	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:29:18.158042+07	\N
9	3	54	\N	20	2026-05-30 11:43:52.841743	2026-06-10 10:29:24.485556	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:29:24.48553+07	\N
4	2	26	\N	20	2026-05-30 11:43:52.841743	2026-06-10 10:30:16.116958	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:30:16.116851+07	\N
10	4	62	45	31	2026-06-01 15:25:08.180273	2026-06-10 10:30:16.825761	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:30:16.825712+07	\N
6	2	28	\N	30	2026-05-30 11:43:52.841743	2026-06-10 10:30:16.947935	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:30:16.947917+07	\N
5	2	27	\N	20	2026-05-30 11:43:52.841743	2026-06-10 10:30:17.153412	\N	\N	0	\N	IMPORTING	2	2026-06-10 10:30:17.15339+07	\N
12	7	18	\N	1	2026-06-10 11:13:42.210294	2026-06-10 11:13:43.91475	\N	\N	0	\N	IMPORTING	2	2026-06-10 11:13:43.91468+07	\N
13	8	52	\N	1	2026-06-10 11:14:15.699899	2026-06-10 11:14:31.517243	\N	\N	0	\N	IMPORTING	2	2026-06-10 11:14:31.517176+07	\N
\.


--
-- Data for Name: import_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_receipts (id, receipt_code, supplier_name, note, created_by, created_at, updated_at, status, review_status, posted_by, posted_at, reviewed_by, reviewed_at, review_note) FROM stdin;
1	IMP-MK-DEMO-001	Công ty Kim Máy May Việt	Nhập kim, chân vịt, suốt chỉ	\N	2026-05-30 11:43:52.841743	2026-06-10 10:26:35.717355	PROCESSING	REVIEWED	\N	2026-05-30 11:43:52.841743+07	1	2026-06-06 17:12:46.993685+07	
4	IMP-1780302308174906000	rồng vàng		1	2026-06-01 15:25:08.174946	2026-06-06 17:12:06.995424	WAITING	REVIEWED	1	2026-06-01 15:25:08.174946+07	1	2026-06-06 17:12:06.995313+07	
3	IMP-MK-DEMO-003	Công ty Phụ Kiện Công Nghiệp XYZ	Nhập mặt bàn, chân bàn, khung thân	\N	2026-05-30 11:43:52.841743	2026-06-06 17:12:09.336645	WAITING	REVIEWED	\N	2026-05-30 11:43:52.841743+07	1	2026-06-06 17:12:09.336614+07	Đã kiểm tra đúng
2	IMP-MK-DEMO-002	Công ty Motor May ABC	Nhập motor, bàn đạp, dây nguồn	\N	2026-05-30 11:43:52.841743	2026-06-06 17:12:42.096759	WAITING	REVIEWED	\N	2026-05-30 11:43:52.841743+07	1	2026-06-06 17:12:42.096718+07	Đã kiểm tra đúng
6	IMP-1781061284690589000	COMPONENT	COMPONENT	1	2026-06-10 10:14:44.690696	2026-06-10 10:14:44.690696	WAITING	NEED_REVIEW	\N	\N	\N	\N	
7	IMP-1781064822206433000	COMPONENT	,	1	2026-06-10 11:13:42.206785	2026-06-10 11:13:42.206785	WAITING	NEED_REVIEW	\N	\N	\N	\N	
8	IMP-1781064855699065000	ALL	l	1	2026-06-10 11:14:15.699086	2026-06-10 11:14:15.699086	WAITING	NEED_REVIEW	\N	\N	\N	\N	
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (id, product_id, tray_id, quantity, created_at, updated_at) FROM stdin;
2	2	2	7	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
3	3	3	8	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
4	4	4	9	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
5	5	5	10	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
6	6	6	11	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
7	7	7	12	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
8	8	8	13	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
9	9	9	14	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
10	10	10	15	2026-05-30 11:36:28.351952	2026-05-30 11:36:28.351952
15	33	38	200	2026-05-30 11:51:43.307287	2026-05-30 11:51:43.307287
16	28	33	200	2026-05-30 11:51:43.307287	2026-05-30 11:51:43.307287
17	54	42	200	2026-05-30 11:51:43.307287	2026-05-30 11:51:43.307287
19	16	23	200	2026-05-30 11:51:43.307287	2026-05-30 11:51:43.307287
23	32	37	200	2026-05-30 11:51:43.307287	2026-05-30 11:51:43.307287
21	56	43	199	2026-05-30 11:51:43.307287	2026-05-30 14:36:31.11545
26	59	44	199	2026-05-30 11:51:43.307287	2026-05-30 14:37:50.89926
29	52	39	199	2026-05-30 11:51:43.307287	2026-05-30 14:38:41.259543
24	26	29	199	2026-05-30 11:51:43.307287	2026-05-30 14:56:42.693525
25	13	20	199	2026-05-30 11:51:43.307287	2026-05-30 14:57:26.638972
1	1	1	10	2026-05-30 11:36:28.351952	2026-05-30 16:09:48.878043
11	14	22	355	2026-05-30 11:51:43.307287	2026-05-30 16:29:30.476243
28	53	40	199	2026-05-30 11:51:43.307287	2026-06-01 14:19:30.641873
27	31	35	199	2026-05-30 11:51:43.307287	2026-06-01 14:23:01.882029
13	27	31	199	2026-05-30 11:51:43.307287	2026-06-01 14:26:07.407198
22	18	27	198	2026-05-30 11:51:43.307287	2026-06-01 14:26:35.735677
18	17	25	198	2026-05-30 11:51:43.307287	2026-06-01 14:27:07.927663
30	62	45	31	2026-06-01 15:25:08.178913	2026-06-01 15:25:08.178913
14	30	34	252	2026-05-30 11:51:43.307287	2026-06-06 15:31:14.033947
12	11	15	525	2026-05-30 11:51:43.307287	2026-06-10 10:24:42.502891
20	12	17	414	2026-05-30 11:51:43.307287	2026-06-10 10:26:35.71302
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, location_code, shelf, description, is_active, created_at, updated_at) FROM stdin;
1	A-01	A	Kệ A - Tầng 01	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
2	A-02	A	Kệ A - Tầng 02	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
3	B-01	B	Kệ B - Tầng 01	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
4	B-02	B	Kệ B - Tầng 02	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
5	C-01	C	Kệ C - Tầng 01	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
6	C-02	C	Kệ C - Tầng 02	t	2026-05-30 11:32:00.812016	2026-05-30 11:32:00.812016
9	A-03	A	Kệ A - Tầng 03 - Thành phẩm máy khâu	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
12	B-03	B	Kệ B - Tầng 03 - Linh kiện cơ khí	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
15	C-03	C	Kệ C - Tầng 03 - Linh kiện điện	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
16	D-01	D	Kệ D - Tầng 01 - Linh kiện vắt sổ	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
17	D-02	D	Kệ D - Tầng 02 - Linh kiện vắt sổ	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
18	D-03	D	Kệ D - Tầng 03 - Linh kiện vắt sổ	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
19	E-01	E	Kệ E - Tầng 01 - Dầu, phụ kiện, đóng gói	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
20	E-02	E	Kệ E - Tầng 02 - Dầu, phụ kiện, đóng gói	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
21	E-03	E	Kệ E - Tầng 03 - Dầu, phụ kiện, đóng gói	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
22	F-01	F	Kệ F - Tầng 01 - Linh kiện thân máy	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
23	F-02	F	Kệ F - Tầng 02 - Linh kiện thân máy	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
24	F-03	F	Kệ F - Tầng 03 - Linh kiện thân máy	t	2026-05-30 11:34:35.412519	2026-05-30 11:34:35.412519
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, unit_price, created_at, updated_at) FROM stdin;
1	9	4	1	8500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
2	3	3	1	1600000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
3	10	5	1	12500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
4	2	2	1	3800000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
5	4	4	1	8500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
6	1	1	1	2500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
7	6	1	1	2500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
8	7	2	1	3800000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
9	5	5	1	12500000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
10	8	3	1	1600000.00	2026-05-30 11:46:34.739138	2026-05-30 11:46:34.739138
17	12	11	1	3000.00	2026-06-04 16:21:59.030924	2026-06-04 16:21:59.030924
18	12	1	1	2500000.00	2026-06-04 16:21:59.030924	2026-06-04 16:21:59.030924
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_code, customer_name, status, total_amount, qr_code, created_by, created_at, updated_at, customer_phone, customer_address) FROM stdin;
6	ORD-MK-DEMO-006	Vũ Quốc Huy	PICKING	2500000.00	ORD-MK-DEMO-006	\N	2026-05-30 11:43:23.782514	2026-05-30 11:43:23.782514	0901000006	15 Phố Huế, Hà Nội
8	ORD-MK-DEMO-008	Bùi Đức Long	COMPLETED	1600000.00	ORD-MK-DEMO-008	\N	2026-05-30 11:43:23.782514	2026-05-30 11:43:23.782514	0901000008	66 Láng Hạ, Hà Nội
9	ORD-MK-DEMO-009	Ngô Hải Nam	COMPLETED	8500000.00	ORD-MK-DEMO-009	\N	2026-05-30 11:43:23.782514	2026-05-30 11:43:23.782514	0901000009	27 Xã Đàn, Hà Nội
10	ORD-MK-DEMO-010	Đặng Phương Nga	CANCELLED	12500000.00	ORD-MK-DEMO-010	\N	2026-05-30 11:43:23.782514	2026-05-30 11:43:23.782514	0901000010	44 Hoàng Quốc Việt, Hà Nội
3	ORD-MK-DEMO-003	Lê Minh Cường	COMPLETED	1600000.00	ORD-MK-DEMO-003	\N	2026-05-30 11:43:23.782514	2026-05-30 14:58:26.12631	0901000003	88 Hai Bà Trưng, Hà Nội
7	ORD-MK-DEMO-007	Hoàng Mai Lan	PICKING	3800000.00	ORD-MK-DEMO-007	\N	2026-05-30 11:43:23.782514	2026-05-30 16:18:57.332582	0901000007	9 Kim Mã, Hà Nội
5	ORD-MK-DEMO-005	Đỗ Thu Hà	COMPLETED	12500000.00	ORD-MK-DEMO-005	\N	2026-05-30 11:43:23.782514	2026-06-01 14:28:42.546028	0901000005	32 Trần Duy Hưng, Hà Nội
12	ORD-260604-001	dungvu	PICKING	2503000.00	ORD-260604-001	1	2026-06-04 16:21:59.02653	2026-06-08 16:35:50.613876	0989878787	ygyguui
4	ORD-MK-DEMO-004	Phạm Hoàng Dũng	PICKING	8500000.00	ORD-MK-DEMO-004	\N	2026-05-30 11:43:23.782514	2026-06-10 10:16:18.165817	0901000004	101 Cầu Giấy, Hà Nội
1	ORD-MK-DEMO-001	Nguyễn Văn An	PICKING	2500000.00	ORD-MK-DEMO-001	\N	2026-05-30 11:43:23.782514	2026-06-10 11:14:38.689192	0901000001	12 Nguyễn Trãi, Hà Nội
2	ORD-MK-DEMO-002	Trần Thị Bình	PICKING	3800000.00	ORD-MK-DEMO-002	\N	2026-05-30 11:43:23.782514	2026-06-10 11:15:02.337057	0901000002	25 Lê Lợi, Hà Nội
\.


--
-- Data for Name: pick_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pick_logs (id, picking_task_id, order_id, product_id, tray_id, picked_quantity, picked_by, picked_at, note) FROM stdin;
28	27	5	31	35	1	2	2026-06-01 14:23:01.882523	Scanned product QR: LK-MK-021
29	28	5	27	31	1	2	2026-06-01 14:26:07.407846	Scanned product QR: LK-MK-017
30	29	5	18	27	1	2	2026-06-01 14:26:34.152797	Scanned product QR: LK-MK-008
31	29	5	18	27	1	2	2026-06-01 14:26:35.736713	Scanned product QR: LK-MK-008
32	30	5	17	25	1	2	2026-06-01 14:27:05.401658	Scanned product QR: LK-MK-007
33	30	5	17	25	1	2	2026-06-01 14:27:07.928556	Scanned product QR: LK-MK-007
34	31	5	11	15	1	2	2026-06-01 14:28:37.804526	Scanned product QR: LK-MK-001
35	31	5	11	15	1	2	2026-06-01 14:28:39.472601	Scanned product QR: LK-MK-001
36	31	5	11	15	1	2	2026-06-01 14:28:41.123665	Scanned product QR: LK-MK-001
37	31	5	11	15	1	2	2026-06-01 14:28:42.544984	Scanned product QR: LK-MK-001
38	33	12	11	15	1	2	2026-06-06 14:54:37.95136	Scanned product QR: LK-MK-001
\.


--
-- Data for Name: picking_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.picking_tasks (id, order_id, product_id, tray_id, required_quantity, picked_quantity, verified, status, assigned_to, created_at, updated_at, assigned_at, started_at, completed_at) FROM stdin;
33	12	11	15	1	1	t	DONE	\N	2026-06-04 16:21:59.040059	2026-06-06 14:54:37.950893	\N	\N	\N
34	12	12	17	1	0	t	PICKING	\N	2026-06-04 16:21:59.040059	2026-06-06 14:55:08.912507	\N	\N	\N
35	12	13	20	1	0	f	PICKING	2	2026-06-04 16:21:59.040059	2026-06-08 16:35:50.609864	2026-06-08 16:35:50.609864+07	2026-06-08 16:35:50.609864+07	\N
3	3	56	43	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:36:31.116089	\N	\N	\N
36	12	16	23	2	0	f	PICKING	2	2026-06-04 16:21:59.040059	2026-06-08 16:35:50.609864	2026-06-08 16:35:50.609864+07	2026-06-08 16:35:50.609864+07	\N
37	12	26	29	1	0	f	PICKING	2	2026-06-04 16:21:59.040059	2026-06-08 16:35:50.609864	2026-06-08 16:35:50.609864+07	2026-06-08 16:35:50.609864+07	\N
2	3	59	44	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:37:50.899633	\N	\N	\N
38	12	28	33	1	0	f	PICKING	2	2026-06-04 16:21:59.040059	2026-06-08 16:35:50.609864	2026-06-08 16:35:50.609864+07	2026-06-08 16:35:50.609864+07	\N
39	12	30	34	1	0	f	PICKING	2	2026-06-04 16:21:59.040059	2026-06-08 16:35:50.609864	2026-06-08 16:35:50.609864+07	2026-06-08 16:35:50.609864+07	\N
4	3	52	39	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:38:41.260293	\N	\N	\N
14	4	54	42	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
5	3	26	29	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:56:42.694049	\N	\N	\N
15	4	53	40	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
6	3	13	20	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:57:26.639559	\N	\N	\N
16	4	27	31	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
7	3	12	17	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-05-30 14:58:26.12355	\N	\N	\N
32	7	2	2	1	0	t	PICKING	2	2026-05-30 14:30:03.475955	2026-05-30 16:19:31.430505	\N	\N	\N
17	4	18	27	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
26	5	53	40	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:19:30.642852	\N	\N	\N
18	4	17	25	2	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
19	4	11	15	2	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 10:16:18.16269	2026-06-10 10:16:18.16269+07	2026-06-10 10:16:18.16269+07	\N
27	5	31	35	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:23:01.882316	\N	\N	\N
20	1	30	34	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
28	5	27	31	1	1	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:26:07.407547	\N	\N	\N
21	1	28	33	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
22	1	26	29	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
29	5	18	27	2	2	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:26:35.736295	\N	\N	\N
23	1	16	23	2	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
24	1	13	20	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
30	5	17	25	2	2	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:27:07.928204	\N	\N	\N
25	1	12	17	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:14:38.687305	2026-06-10 11:14:38.687305+07	2026-06-10 11:14:38.687305+07	\N
8	2	33	38	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
9	2	32	37	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
10	2	31	35	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
31	5	11	15	4	4	t	DONE	\N	2026-05-30 11:52:04.126017	2026-06-01 14:28:42.54473	\N	\N	\N
11	2	16	23	3	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
12	2	14	22	1	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
13	2	12	17	2	0	f	PICKING	2	2026-05-30 11:52:04.126017	2026-06-10 11:15:02.336088	2026-06-10 11:15:02.336088+07	2026-06-10 11:15:02.336088+07	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, product_code, product_name, description, unit, min_stock, price, is_active, created_at, updated_at, product_type, image_url, qr_code, rfid_code) FROM stdin;
61	TP-DNGG-001	dunggu		pcs	0	0.00	f	2026-05-30 15:09:18.005825	2026-05-30 15:09:22.380451	FINISHED_GOOD		TP-DNGG-001	\N
11	LK-MK-001	Kim máy khâu DBx1	Kim máy khâu công nghiệp DBx1	cái	500	3000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-001	LK-MK-001	\N
12	LK-MK-002	Kim máy khâu HA	Kim máy khâu gia đình HA	cái	500	2500.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-002	LK-MK-002	\N
13	LK-MK-003	Chân vịt thường	Chân vịt may thường	cái	100	25000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-003	LK-MK-003	\N
49	LK-MK-039	Bánh đà	Bánh đà máy khâu	cái	30	180000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-039	LK-MK-039	\N
50	LK-MK-040	Nắp che kim	Nắp bảo vệ vùng kim	cái	50	40000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-040	LK-MK-040	\N
52	LK-MK-042	Vỏ nhựa máy khâu	Bộ vỏ nhựa máy khâu gia đình	bộ	20	450000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-042	LK-MK-042	\N
18	LK-MK-008	Ổ chao máy khâu	Ổ chao máy khâu công nghiệp	cái	50	120000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-008	LK-MK-008	\N
21	LK-MK-011	Bàn lừa	Bàn lừa kéo vải	cái	50	95000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-011	LK-MK-011	\N
38	LK-MK-028	Đĩa căng chỉ	Đĩa căng chỉ kim loại	cái	100	15000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-028	LK-MK-028	\N
20	LK-MK-010	Mặt nguyệt	Mặt nguyệt máy khâu	cái	50	85000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-010	LK-MK-010	\N
46	LK-MK-036	Dầu máy khâu	Dầu bôi trơn máy khâu	chai	100	30000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-036	LK-MK-036	\N
30	LK-MK-020	Dây nguồn máy khâu	Dây nguồn cấp điện máy khâu	sợi	50	45000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-020	LK-MK-020	\N
31	LK-MK-021	Bo mạch điều khiển	Bo mạch điều khiển máy khâu điện tử	cái	15	950000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-021	LK-MK-021	\N
32	LK-MK-022	Màn hình LCD	Màn hình hiển thị máy khâu điện tử	cái	15	650000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-022	LK-MK-022	\N
33	LK-MK-023	Nút bấm chức năng	Cụm nút bấm chức năng	bộ	30	120000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-023	LK-MK-023	\N
34	LK-MK-024	Đèn LED máy khâu	Đèn LED chiếu sáng vùng may	cái	50	55000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-024	LK-MK-024	\N
35	LK-MK-025	Cảm biến chỉ	Cảm biến phát hiện đứt chỉ	cái	30	180000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-025	LK-MK-025	\N
39	LK-MK-029	Lò xo căng chỉ	Lò xo bộ căng chỉ	cái	100	10000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-029	LK-MK-029	\N
57	LK-MK-047	Tem nhãn máy	Tem nhãn thương hiệu và thông số máy	bộ	100	12000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-047	LK-MK-047	\N
56	LK-MK-046	Bộ ốc lắp ráp máy	Bộ ốc vít lắp ráp máy khâu	bộ	100	25000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-046	LK-MK-046	\N
22	LK-MK-012	Cò giật chỉ	Cò giật chỉ máy khâu	cái	50	70000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-012	LK-MK-012	\N
58	LK-MK-048	Sách hướng dẫn sử dụng	Tài liệu hướng dẫn sử dụng	quyển	100	15000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-048	LK-MK-048	\N
59	LK-MK-049	Hộp carton đóng gói	Hộp carton đóng gói máy khâu	cái	100	45000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-049	LK-MK-049	\N
60	LK-MK-050	Xốp chống sốc	Xốp chống sốc đóng gói máy khâu	bộ	100	25000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-050	LK-MK-050	\N
9	TP-MK-009	Máy thùa khuy	Máy thùa khuy công nghiệp	cái	2	18500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-009	TP-MK-009	\N
10	TP-MK-010	Máy đính nút	Máy đính nút tự động	cái	2	17500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-010	TP-MK-010	\N
1	TP-MK-001	Máy khâu gia đình cơ bản	Máy khâu gia đình dòng cơ bản	cái	5	2500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-001	TP-MK-001	\N
2	TP-MK-002	Máy khâu gia đình đa năng	Máy khâu gia đình nhiều đường may	cái	5	3800000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-002	TP-MK-002	\N
3	TP-MK-003	Máy khâu mini để bàn	Máy khâu mini nhỏ gọn	cái	5	1600000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-003	TP-MK-003	\N
4	TP-MK-004	Máy khâu công nghiệp 1 kim	Máy khâu công nghiệp 1 kim tốc độ cao	cái	3	8500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-004	TP-MK-004	\N
5	TP-MK-005	Máy khâu công nghiệp 2 kim	Máy khâu công nghiệp 2 kim	cái	3	12500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-005	TP-MK-005	\N
6	TP-MK-006	Máy vắt sổ 4 chỉ	Máy vắt sổ 4 chỉ dùng trong may mặc	cái	3	9800000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-006	TP-MK-006	\N
7	TP-MK-007	Máy vắt sổ 5 chỉ	Máy vắt sổ 5 chỉ công nghiệp	cái	3	11500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-007	TP-MK-007	\N
8	TP-MK-008	Máy kansai viền	Máy kansai dùng may viền	cái	3	13500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	FINISHED_GOOD	https://placehold.co/600x400?text=TP-MK-008	TP-MK-008	\N
19	LK-MK-009	Thuyền suốt	Thuyền suốt máy khâu	cái	100	45000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-009	LK-MK-009	\N
47	LK-MK-037	Bơm dầu mini	Bơm dầu cho máy công nghiệp	cái	30	120000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-037	LK-MK-037	\N
48	LK-MK-038	Ống dẫn dầu	Ống dẫn dầu bôi trơn	sợi	100	15000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-038	LK-MK-038	\N
23	LK-MK-013	Trục kim	Trục giữ kim máy khâu	cái	50	90000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-013	LK-MK-013	\N
24	LK-MK-014	Ốc giữ kim	Ốc cố định kim máy khâu	cái	200	5000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-014	LK-MK-014	\N
40	LK-MK-030	Trụ chỉ	Trụ giữ cuộn chỉ	cái	100	20000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-030	LK-MK-030	\N
41	LK-MK-031	Dao cắt chỉ	Dao cắt chỉ tự động	cái	50	85000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-031	LK-MK-031	\N
42	LK-MK-032	Cụm dao máy vắt sổ	Cụm dao trên dưới máy vắt sổ	bộ	30	220000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-032	LK-MK-032	\N
43	LK-MK-033	Kim vắt sổ DCx27	Kim máy vắt sổ DCx27	cái	500	3500.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-033	LK-MK-033	\N
53	LK-MK-043	Mặt bàn máy công nghiệp	Mặt bàn gỗ cho máy công nghiệp	cái	20	550000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-043	LK-MK-043	\N
14	LK-MK-004	Chân vịt cuốn biên	Chân vịt cuốn biên vải	cái	100	35000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-004	LK-MK-004	\N
15	LK-MK-005	Chân vịt tra khóa	Chân vịt dùng để tra khóa kéo	cái	100	30000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-005	LK-MK-005	\N
16	LK-MK-006	Suốt chỉ nhựa	Suốt chỉ nhựa cho máy gia đình	cái	300	5000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-006	LK-MK-006	\N
17	LK-MK-007	Suốt chỉ kim loại	Suốt chỉ kim loại cho máy công nghiệp	cái	300	7000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-007	LK-MK-007	\N
36	LK-MK-026	Cảm biến kim	Cảm biến vị trí kim	cái	30	200000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-026	LK-MK-026	\N
37	LK-MK-027	Bộ căng chỉ	Cụm căng chỉ máy khâu	bộ	50	95000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-027	LK-MK-027	\N
44	LK-MK-034	Mỏ móc vắt sổ	Mỏ móc máy vắt sổ	cái	30	250000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-034	LK-MK-034	\N
45	LK-MK-035	Chân vịt vắt sổ	Chân vịt dành cho máy vắt sổ	cái	50	75000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-035	LK-MK-035	\N
25	LK-MK-015	Dây curoa motor	Dây curoa truyền động motor	sợi	80	65000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-015	LK-MK-015	\N
26	LK-MK-016	Motor máy khâu gia đình	Motor dùng cho máy khâu gia đình	cái	20	450000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-016	LK-MK-016	\N
51	LK-MK-041	Khung thân máy	Khung thân chính máy khâu	cái	20	1500000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-041	LK-MK-041	\N
54	LK-MK-044	Chân bàn máy công nghiệp	Bộ chân bàn sắt cho máy công nghiệp	bộ	20	650000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-044	LK-MK-044	\N
55	LK-MK-045	Khay phụ kiện	Khay đựng phụ kiện máy khâu	cái	50	35000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-045	LK-MK-045	\N
27	LK-MK-017	Motor máy khâu công nghiệp	Motor công suất lớn cho máy công nghiệp	cái	20	1200000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-017	LK-MK-017	\N
28	LK-MK-018	Bàn đạp điều tốc	Bàn đạp điều tốc máy khâu	cái	30	180000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-018	LK-MK-018	\N
29	LK-MK-019	Công tắc nguồn	Công tắc nguồn máy khâu	cái	50	35000.00	t	2026-05-30 11:35:10.128751	2026-05-30 11:35:10.128751	COMPONENT	https://placehold.co/600x400?text=LK-MK-019	LK-MK-019	\N
62	LK-LKTSST-001	lktesst		pcs	20	0.00	t	2026-06-01 15:22:36.381696	2026-06-01 15:22:36.381696	COMPONENT		LK-LKTSST-001	\N
64	LK-KMKD-002	Kim máy khâu DBx1		pcs	0	0.00	f	2026-06-01 16:48:52.836241	2026-06-01 16:51:02.296632	COMPONENT		LK-KMKD-002	\N
63	LK-KMKD-001	Kim máy khâu DBx1		pcs	0	0.00	f	2026-06-01 16:40:02.249853	2026-06-01 16:51:04.089575	COMPONENT		LK-KMKD-001	\N
\.


--
-- Data for Name: putaway_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.putaway_requests (id, product_qr_code, tray_qr_code, quantity, note, reference_code, status, requested_by, approved_by, approved_at, reject_reason, created_at, updated_at) FROM stdin;
1	LK-MK-001	B-01-T01	1			APPROVED	2	1	2026-06-01 14:37:09.600776+07		2026-06-01 14:37:00.086392+07	2026-06-01 14:37:09.600809+07
2	LK-MK-001	B-01-T01	51			APPROVED	2	1	2026-06-02 16:50:40.239738+07		2026-06-02 16:50:32.569399+07	2026-06-02 16:50:40.239785+07
3	LK-MK-001	B-01-T01	1			APPROVED	2	1	2026-06-04 15:40:23.706669+07		2026-06-04 15:40:15.753894+07	2026-06-04 15:40:23.706709+07
4	LK-MK-001	B-01-T01	51	Nhập kho		APPROVED	2	1	2026-06-04 16:12:14.275906+07		2026-06-04 16:12:01.222623+07	2026-06-04 16:12:14.275975+07
5	LK-MK-002	B-01-T03	15			APPROVED	2	1	2026-06-04 16:15:01.274587+07		2026-06-04 16:14:54.016072+07	2026-06-04 16:15:01.274666+07
8	LK-MK-020	C-02-T04	19			APPROVED	2	1	2026-06-06 15:31:12.758782+07		2026-06-06 15:31:10.645036+07	2026-06-06 15:31:12.758811+07
7	LK-MK-020	C-02-T04	18			APPROVED	2	1	2026-06-06 15:31:13.42093+07		2026-06-06 15:31:06.383148+07	2026-06-06 15:31:13.420988+07
6	LK-MK-020	C-02-T04	15			APPROVED	2	1	2026-06-06 15:31:14.034688+07		2026-06-06 15:30:48.982827+07	2026-06-06 15:31:14.034932+07
\.


--
-- Data for Name: rfid_audit_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_audit_items (id, session_id, epc_code, product_id, registered_tray_id, expected_tray_id, scanned_tray_id, result_type, action_status, note, created_at) FROM stdin;
1	1	E280699500004009C4745605	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
2	1	E280699500005009C4745205	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
3	1	E280117000000213CE8ABB32	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
4	1	E2806894000050221E21DCD9	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
5	1	E280117000000213CE8ABB22	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
6	1	E280689400005023E7C7C9D1	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
7	1	E280117000000213CE8ABB12	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
8	1	E280699500005009C4743E05	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 14:59:03.622879+07
9	2	E280699500004009C4745605	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
10	2	E280689400005023E7C7BDD1	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
11	2	3C140BC950001C7BC878BD38	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
12	2	E280699500005009C4745205	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
13	2	E280689400004023E7C7CDD2	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
14	2	E28011710000020D5F7C5981	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
15	2	E2806894000040221E21DCC9	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
16	2	E2806894000050221E21DCC8	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
17	2	E280B1F94794B1F94794FFFF	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
18	2	E280117000000213CE8ABB12	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
19	2	E2068940000502324041002	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
20	2	E2806894000050221E21DCD3	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
21	2	E20117000000213CE8ABB22	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
22	2	E280699500005009C4743E05	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
23	2	E28068940000502324041001	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
24	2	E28068940000502324041002	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
25	2	E280699500005009C4744A05	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
26	2	E280689400004023E7C7D5D2E280689400004023E7C7CDD2	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
27	2	E28068940000502324041002E2	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
28	2	E280117000000213CE8AA1E2	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:04:45.675271+07
29	2	E280117000000213CE8ABB32	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
30	2	E280689400005023E7C7D1D2	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
31	2	E280117000000213CE8ABB02	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
32	2	E20699500005009C4744A05	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
33	2	0699500005009C4744605	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:04:45.675271+07
34	3	E280699500004009C4745605	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:12:05.211304+07
35	3	E280117000000213CE8ABB22	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:12:05.211304+07
36	3	E280699500005009C4745205	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:12:05.211304+07
37	4	E280699500005009C4744605	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:36:21.368085+07
38	4	E2806894000050221E21DCD3	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:36:21.368085+07
39	4	E280117000000213CE8AA1D2	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:36:21.368085+07
40	4	E280689400004023E7C7D5D2	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:36:21.368085+07
41	4	E28011710000020D5F7C5981	\N	\N	15	15	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 15:36:21.368085+07
42	4	E280117000000213CE8ABB22	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:36:21.368085+07
43	4	E280117000000213CE8AA1E2	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:36:21.368085+07
44	4	E280699500005009C4745205	11	15	15	15	CORRECT_LOCATION	PENDING	EPC đúng khay đang kiểm kê	2026-06-04 15:36:21.368085+07
45	5	E280689400004023E7C7D5D2	11	15	1	1	WRONG_LOCATION	PENDING	EPC thuộc khay khác hoặc chưa có khay đăng ký	2026-06-04 16:18:00.735613+07
46	5	E280117000000213CE8ABB02	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 16:18:00.735613+07
47	5	E280699500004009C4743A05	\N	\N	1	1	UNREGISTERED	PENDING	EPC chưa đăng ký	2026-06-04 16:18:00.735613+07
\.


--
-- Data for Name: rfid_audit_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_audit_sessions (id, session_code, location_id, tray_id, scanned_by, status, total_scanned, matched_count, wrong_location_count, unregistered_count, created_at, confirmed_at) FROM stdin;
1	RFID-1780559943619244000	1	1	2	DRAFT	8	0	0	8	2026-06-04 14:59:03.619457+07	\N
2	RFID-1780560285673677000	3	15	2	DRAFT	25	6	0	19	2026-06-04 15:04:45.673862+07	\N
3	RFID-1780560725208984000	3	15	2	DRAFT	3	3	0	0	2026-06-04 15:12:05.209235+07	\N
4	RFID-1780562181365503000	3	15	2	DRAFT	8	5	0	3	2026-06-04 15:36:21.366031+07	\N
5	RFID-1780564680734201000	1	1	2	DRAFT	3	0	1	2	2026-06-04 16:18:00.734387+07	\N
\.


--
-- Data for Name: rfid_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_tags (id, epc_code, target_type, product_id, tray_id, is_active, note, created_by, created_at, updated_at) FROM stdin;
1	E280689400004023E7C7D5D2	PRODUCT	11	15	t		2	2026-06-04 15:03:45.112925+07	2026-06-04 15:03:45.112925+07
2	E280699500005009C4745205	PRODUCT	11	15	t		2	2026-06-04 15:03:45.117607+07	2026-06-04 15:03:45.117607+07
3	E280117000000213CE8ABB22	PRODUCT	11	15	t		2	2026-06-04 15:03:45.118067+07	2026-06-04 15:03:45.118067+07
4	E280699500004009C4744205	PRODUCT	11	15	t		2	2026-06-04 15:03:45.118387+07	2026-06-04 15:03:45.118387+07
5	E280117000000213CE8AA1F2	PRODUCT	11	15	t		2	2026-06-04 15:03:45.118755+07	2026-06-04 15:03:45.118755+07
6	E280699500004009C4745605	PRODUCT	11	15	t		2	2026-06-04 15:03:45.119117+07	2026-06-04 15:03:45.119117+07
7	3C140BC950001C7BC878BD38	PRODUCT	11	15	t		2	2026-06-04 15:03:45.119467+07	2026-06-04 15:03:45.119467+07
8	E280689400004023E7C7CDD2	PRODUCT	11	15	t		2	2026-06-04 15:03:45.119722+07	2026-06-04 15:03:45.119722+07
9	E280689400005023E7C7BDD1	PRODUCT	11	15	t		2	2026-06-04 15:03:45.119913+07	2026-06-04 15:03:45.119913+07
10	E280117000000213CE8AA1E2	PRODUCT	11	15	t		2	2026-06-04 15:03:45.120122+07	2026-06-04 15:03:45.120122+07
11	E280117000000213CE8AA1D2	PRODUCT	11	15	t		2	2026-06-04 15:03:45.120334+07	2026-06-04 15:03:45.120334+07
\.


--
-- Data for Name: stock_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_transactions (id, transaction_type, product_id, tray_id, quantity, before_quantity, after_quantity, reference_code, note, created_by, created_at, scan_method, scanned_code, audit_session_id) FROM stdin;
1	IMPORT	1	1	6	0	6	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
2	IMPORT	2	2	7	0	7	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
3	IMPORT	3	3	8	0	8	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
4	IMPORT	4	4	9	0	9	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
5	IMPORT	5	5	10	0	10	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
6	IMPORT	6	6	11	0	11	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
7	IMPORT	7	7	12	0	12	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
8	IMPORT	8	8	13	0	13	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
9	IMPORT	9	9	14	0	14	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
10	IMPORT	10	10	15	0	15	SEED-IMPORT-001	Seed tồn kho ban đầu cho dữ liệu máy khâu	\N	2026-05-30 11:36:38.961685	\N	\N	\N
11	IMPORT	11	\N	200	100	300	IMP-MK-DEMO-001	Nhập kim DBx1	\N	2026-05-30 11:44:08.273776	\N	\N	\N
12	IMPORT	12	\N	200	100	300	IMP-MK-DEMO-001	Nhập kim HA	\N	2026-05-30 11:44:08.273776	\N	\N	\N
13	IMPORT	13	\N	50	50	100	IMP-MK-DEMO-001	Nhập chân vịt thường	\N	2026-05-30 11:44:08.273776	\N	\N	\N
14	IMPORT	26	\N	20	20	40	IMP-MK-DEMO-002	Nhập motor gia đình	\N	2026-05-30 11:44:08.273776	\N	\N	\N
15	IMPORT	27	\N	20	20	40	IMP-MK-DEMO-002	Nhập motor công nghiệp	\N	2026-05-30 11:44:08.273776	\N	\N	\N
16	IMPORT	28	\N	30	30	60	IMP-MK-DEMO-002	Nhập bàn đạp	\N	2026-05-30 11:44:08.273776	\N	\N	\N
17	IMPORT	51	\N	15	10	25	IMP-MK-DEMO-003	Nhập khung thân máy	\N	2026-05-30 11:44:08.273776	\N	\N	\N
18	IMPORT	53	\N	20	20	40	IMP-MK-DEMO-003	Nhập mặt bàn	\N	2026-05-30 11:44:08.273776	\N	\N	\N
19	IMPORT	54	\N	20	20	40	IMP-MK-DEMO-003	Nhập chân bàn	\N	2026-05-30 11:44:08.273776	\N	\N	\N
20	EXPORT	11	\N	1	300	299	ORD-MK-DEMO-004	Picking scan product QR	\N	2026-05-30 11:44:08.273776	\N	\N	\N
21	EXPORT	18	\N	1	80	79	ORD-MK-DEMO-004	Picking scan product QR	\N	2026-05-30 11:44:08.273776	\N	\N	\N
22	EXPORT	11	\N	1	299	298	ORD-MK-DEMO-005	Picking scan product QR	\N	2026-05-30 11:44:08.273776	\N	\N	\N
23	EXPORT	11	\N	1	298	297	ORD-MK-DEMO-005	Picking scan product QR	\N	2026-05-30 11:44:08.273776	\N	\N	\N
24	EXPORT	17	\N	1	120	119	ORD-MK-DEMO-005	Picking scan product QR	\N	2026-05-30 11:44:08.273776	\N	\N	\N
25	EXPORT	17	\N	1	119	118	ORD-MK-DEMO-004	Audit sample export	\N	2026-05-30 11:44:08.273776	\N	\N	\N
26	EXPORT	18	\N	1	79	78	ORD-MK-DEMO-005	Audit sample export	\N	2026-05-30 11:44:08.273776	\N	\N	\N
27	EXPORT	31	\N	1	30	29	ORD-MK-DEMO-005	Audit sample export	\N	2026-05-30 11:44:08.273776	\N	\N	\N
28	ADJUST	46	\N	-2	80	78	ADJ-MK-DEMO-001	Kiểm kê thiếu dầu máy khâu	\N	2026-05-30 11:44:08.273776	\N	\N	\N
29	ADJUST	59	\N	5	60	65	ADJ-MK-DEMO-002	Kiểm kê thừa hộp carton	\N	2026-05-30 11:44:08.273776	\N	\N	\N
30	ADJUST	60	\N	-3	70	67	ADJ-MK-DEMO-003	Kiểm kê thiếu xốp chống sốc	\N	2026-05-30 11:44:08.273776	\N	\N	\N
31	EXPORT	56	43	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:36:31.118108	\N	\N	\N
32	EXPORT	59	44	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:37:50.900685	\N	\N	\N
33	EXPORT	52	39	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:38:41.263547	\N	\N	\N
34	EXPORT	26	29	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:56:42.695797	\N	\N	\N
35	EXPORT	13	20	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:57:26.641539	\N	\N	\N
36	EXPORT	12	17	1	200	199	ORD-MK-DEMO-003	Product QR scan picking	2	2026-05-30 14:58:26.12515	\N	\N	\N
37	ADJUST	1	1	4	6	10			2	2026-05-30 16:09:48.881402	\N	\N	\N
38	IMPORT	11	15	15	200	215			2	2026-05-30 16:27:41.513809	\N	\N	\N
39	IMPORT	14	22	155	200	355			2	2026-05-30 16:29:30.476903	\N	\N	\N
40	EXPORT	53	40	1	200	199	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:19:30.649433	\N	\N	\N
41	EXPORT	31	35	1	200	199	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:23:01.884165	\N	\N	\N
42	EXPORT	27	31	1	200	199	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:26:07.408854	\N	\N	\N
43	EXPORT	18	27	1	200	199	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:26:34.155073	\N	\N	\N
44	EXPORT	18	27	1	199	198	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:26:35.737777	\N	\N	\N
45	EXPORT	17	25	1	200	199	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:27:05.402342	\N	\N	\N
46	EXPORT	17	25	1	199	198	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:27:07.929619	\N	\N	\N
47	EXPORT	11	15	1	215	214	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:28:37.805807	\N	\N	\N
48	EXPORT	11	15	1	214	213	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:28:39.472993	\N	\N	\N
49	EXPORT	11	15	1	213	212	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:28:41.124297	\N	\N	\N
50	EXPORT	11	15	1	212	211	ORD-MK-DEMO-005	Product QR scan picking	2	2026-06-01 14:28:42.545469	\N	\N	\N
51	IMPORT	11	15	1	211	212			1	2026-06-01 14:37:09.599694	\N	\N	\N
52	IMPORT	62	45	31	0	31	IMP-1780302308174906000		1	2026-06-01 15:25:08.181688	\N	\N	\N
53	IMPORT	11	15	51	212	263			1	2026-06-02 16:50:40.236711	\N	\N	\N
54	IMPORT	11	15	11	263	274			2	2026-06-04 15:03:45.122368	RFID	E280689400004023E7C7D5D2\nE280699500005009C4745205\nE280117000000213CE8ABB22\nE280699500004009C4744205\nE280117000000213CE8AA1F2\nE280699500004009C4745605\n3C140BC950001C7BC878BD38\nE280689400004023E7C7CDD2\nE280689400005023E7C7BDD1\nE280117000000213CE8AA1E2\nE280117000000213CE8AA1D2	\N
55	IMPORT	11	15	1	274	275			1	2026-06-04 15:40:23.703984			\N
56	IMPORT	11	15	51	275	326		Nhập kho	1	2026-06-04 16:12:14.272803			\N
57	IMPORT	12	17	15	199	214			1	2026-06-04 16:15:01.271978			\N
58	EXPORT	11	15	1	326	325	ORD-260604-001	Quét QR sản phẩm khi picking	2	2026-06-06 14:54:37.956372	\N	\N	\N
59	IMPORT	30	34	19	200	219			1	2026-06-06 15:31:12.757583	\N	\N	\N
60	IMPORT	30	34	18	219	237			1	2026-06-06 15:31:13.4189	\N	\N	\N
61	IMPORT	30	34	15	237	252			1	2026-06-06 15:31:14.034216	\N	\N	\N
62	IMPORT	11	15	200	325	525	IMP-MK-DEMO-001		2	2026-06-10 10:24:42.505109	\N	\N	\N
63	IMPORT	12	17	200	214	414	IMP-MK-DEMO-001		2	2026-06-10 10:26:35.714821	\N	\N	\N
\.


--
-- Data for Name: trays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trays (id, tray_code, product_id, location_id, qr_code, description, is_active, created_at, updated_at, rfid_code) FROM stdin;
1	A-01-T01	1	1	A-01-T01	Khay thành phẩm cho TP-MK-001	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
2	A-01-T02	2	1	A-01-T02	Khay thành phẩm cho TP-MK-002	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
3	A-01-T03	3	1	A-01-T03	Khay thành phẩm cho TP-MK-003	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
4	A-01-T04	4	1	A-01-T04	Khay thành phẩm cho TP-MK-004	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
5	A-02-T01	5	2	A-02-T01	Khay thành phẩm cho TP-MK-005	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
6	A-02-T02	6	2	A-02-T02	Khay thành phẩm cho TP-MK-006	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
7	A-02-T03	7	2	A-02-T03	Khay thành phẩm cho TP-MK-007	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
8	A-02-T04	8	2	A-02-T04	Khay thành phẩm cho TP-MK-008	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
9	A-03-T01	9	9	A-03-T01	Khay thành phẩm cho TP-MK-009	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
10	A-03-T02	10	9	A-03-T02	Khay thành phẩm cho TP-MK-010	t	2026-05-30 11:36:10.408452	2026-05-30 11:36:10.408452	\N
15	B-01-T01	11	3	B-01-T01	Auto tray cho linh kiện BOM LK-MK-001	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
17	B-01-T03	12	3	B-01-T03	Auto tray cho linh kiện BOM LK-MK-002	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
20	B-02-T02	13	4	B-02-T02	Auto tray cho linh kiện BOM LK-MK-003	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
22	B-02-T04	14	4	B-02-T04	Auto tray cho linh kiện BOM LK-MK-004	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
23	B-03-T01	16	12	B-03-T01	Auto tray cho linh kiện BOM LK-MK-006	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
25	B-03-T03	17	12	B-03-T03	Auto tray cho linh kiện BOM LK-MK-007	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
27	C-01-T01	18	5	C-01-T01	Auto tray cho linh kiện BOM LK-MK-008	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
29	C-01-T03	26	5	C-01-T03	Auto tray cho linh kiện BOM LK-MK-016	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
31	C-02-T01	27	6	C-02-T01	Auto tray cho linh kiện BOM LK-MK-017	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
33	C-02-T03	28	6	C-02-T03	Auto tray cho linh kiện BOM LK-MK-018	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
34	C-02-T04	30	6	C-02-T04	Auto tray cho linh kiện BOM LK-MK-020	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
35	C-03-T01	31	15	C-03-T01	Auto tray cho linh kiện BOM LK-MK-021	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
37	C-03-T03	32	15	C-03-T03	Auto tray cho linh kiện BOM LK-MK-022	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
38	C-03-T04	33	15	C-03-T04	Auto tray cho linh kiện BOM LK-MK-023	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
39	D-01-T01	52	16	D-01-T01	Auto tray cho linh kiện BOM LK-MK-042	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
40	D-01-T02	53	16	D-01-T02	Auto tray cho linh kiện BOM LK-MK-043	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
42	D-01-T04	54	16	D-01-T04	Auto tray cho linh kiện BOM LK-MK-044	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
43	D-02-T01	56	17	D-02-T01	Auto tray cho linh kiện BOM LK-MK-046	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
44	D-02-T02	59	17	D-02-T02	Auto tray cho linh kiện BOM LK-MK-049	t	2026-05-30 11:51:36.193836	2026-05-30 11:51:36.193836	\N
45	A-01-T05	62	1	A-01-T05		t	2026-06-01 15:24:01.575248	2026-06-01 15:24:01.575248	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, full_name, is_active, created_at, updated_at, role) FROM stdin;
1	admin	$2a$10$TRMD3PRM4THAZImTdVFHH.8YFj6pHNQGtZpnL0lDUQBbh39.wBwHu	System Admin	t	2026-05-18 09:01:46.883546	2026-05-18 09:01:46.883546	ADMIN
3	dungvu	$2a$10$09KNb3Z4Pptl93n9cTsydeVZphr83Udnn66n6b4Idj8nqBvTmBswm	dungvu	t	2026-06-01 13:59:04.773825	2026-06-04 16:37:12.845195	STAFF
2	staff	$2a$10$a3EeSznUcs8JTFHbuA9EkevA9LmlzC89xTXwbtNXsU1CGOK.zVoTK	Warehouse Staff	t	2026-05-18 09:01:46.955306	2026-06-05 16:50:03.770951	STAFF
6	dungvu2	$2a$10$Wyg/EAA.m7ryGG535OU3n.iGbvGBHDMl2BaUMn/j/E3GLeCrMTCbG	dungvu2	t	2026-06-04 16:37:32.892427	2026-06-05 16:50:54.4033	STAFF
\.


--
-- Name: bom_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bom_items_id_seq', 45, true);


--
-- Name: boms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.boms_id_seq', 7, true);


--
-- Name: import_receipt_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_receipt_items_id_seq', 13, true);


--
-- Name: import_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_receipts_id_seq', 8, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_id_seq', 30, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 24, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 24, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 15, true);


--
-- Name: pick_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pick_logs_id_seq', 38, true);


--
-- Name: picking_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.picking_tasks_id_seq', 39, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 64, true);


--
-- Name: putaway_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.putaway_requests_id_seq', 8, true);


--
-- Name: rfid_audit_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_audit_items_id_seq', 47, true);


--
-- Name: rfid_audit_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_audit_sessions_id_seq', 5, true);


--
-- Name: rfid_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_tags_id_seq', 11, true);


--
-- Name: stock_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_transactions_id_seq', 63, true);


--
-- Name: trays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trays_id_seq', 45, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: bom_items bom_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_pkey PRIMARY KEY (id);


--
-- Name: boms boms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boms
    ADD CONSTRAINT boms_pkey PRIMARY KEY (id);


--
-- Name: import_receipt_items import_receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipt_items
    ADD CONSTRAINT import_receipt_items_pkey PRIMARY KEY (id);


--
-- Name: import_receipts import_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts
    ADD CONSTRAINT import_receipts_pkey PRIMARY KEY (id);


--
-- Name: import_receipts import_receipts_receipt_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts
    ADD CONSTRAINT import_receipts_receipt_code_key UNIQUE (receipt_code);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_product_id_tray_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_tray_id_key UNIQUE (product_id, tray_id);


--
-- Name: locations locations_location_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_location_code_key UNIQUE (location_code);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pick_logs pick_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_pkey PRIMARY KEY (id);


--
-- Name: picking_tasks picking_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks
    ADD CONSTRAINT picking_tasks_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: putaway_requests putaway_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.putaway_requests
    ADD CONSTRAINT putaway_requests_pkey PRIMARY KEY (id);


--
-- Name: rfid_audit_items rfid_audit_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_audit_items
    ADD CONSTRAINT rfid_audit_items_pkey PRIMARY KEY (id);


--
-- Name: rfid_audit_sessions rfid_audit_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_audit_sessions
    ADD CONSTRAINT rfid_audit_sessions_pkey PRIMARY KEY (id);


--
-- Name: rfid_audit_sessions rfid_audit_sessions_session_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_audit_sessions
    ADD CONSTRAINT rfid_audit_sessions_session_code_key UNIQUE (session_code);


--
-- Name: rfid_tags rfid_tags_epc_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags
    ADD CONSTRAINT rfid_tags_epc_code_key UNIQUE (epc_code);


--
-- Name: rfid_tags rfid_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags
    ADD CONSTRAINT rfid_tags_pkey PRIMARY KEY (id);


--
-- Name: stock_transactions stock_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_pkey PRIMARY KEY (id);


--
-- Name: trays trays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays
    ADD CONSTRAINT trays_pkey PRIMARY KEY (id);


--
-- Name: trays trays_tray_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays
    ADD CONSTRAINT trays_tray_code_key UNIQUE (tray_code);


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
-- Name: trays ux_trays_product_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays
    ADD CONSTRAINT ux_trays_product_id UNIQUE (product_id);


--
-- Name: idx_import_receipt_items_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_import_receipt_items_assignment ON public.import_receipt_items USING btree (assigned_to, status);


--
-- Name: idx_import_receipt_items_receipt_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_import_receipt_items_receipt_status ON public.import_receipt_items USING btree (receipt_id, status);


--
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_product ON public.inventory USING btree (product_id);


--
-- Name: idx_inventory_tray; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_tray ON public.inventory USING btree (tray_id);


--
-- Name: idx_locations_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_code ON public.locations USING btree (location_code);


--
-- Name: idx_orders_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_code ON public.orders USING btree (order_code);


--
-- Name: idx_pick_logs_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pick_logs_order ON public.pick_logs USING btree (order_id);


--
-- Name: idx_picking_tasks_order_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_picking_tasks_order_assignment ON public.picking_tasks USING btree (order_id, assigned_to, status);


--
-- Name: idx_products_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_code ON public.products USING btree (product_code);


--
-- Name: idx_putaway_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_putaway_requests_status ON public.putaway_requests USING btree (status);


--
-- Name: idx_rfid_audit_items_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfid_audit_items_session_id ON public.rfid_audit_items USING btree (session_id);


--
-- Name: idx_rfid_tags_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfid_tags_product_id ON public.rfid_tags USING btree (product_id);


--
-- Name: idx_rfid_tags_tray_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfid_tags_tray_id ON public.rfid_tags USING btree (tray_id);


--
-- Name: idx_stock_transactions_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_transactions_product ON public.stock_transactions USING btree (product_id);


--
-- Name: idx_trays_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trays_code ON public.trays USING btree (tray_code);


--
-- Name: uq_products_qr_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_products_qr_code ON public.products USING btree (qr_code);


--
-- Name: uq_products_rfid_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_products_rfid_code ON public.products USING btree (rfid_code) WHERE (rfid_code IS NOT NULL);


--
-- Name: uq_trays_rfid_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_trays_rfid_code ON public.trays USING btree (rfid_code) WHERE (rfid_code IS NOT NULL);


--
-- Name: bom_items bom_items_bom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.boms(id) ON DELETE CASCADE;


--
-- Name: bom_items bom_items_component_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_component_product_id_fkey FOREIGN KEY (component_product_id) REFERENCES public.products(id);


--
-- Name: boms boms_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boms
    ADD CONSTRAINT boms_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: import_receipt_items import_receipt_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipt_items
    ADD CONSTRAINT import_receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: import_receipt_items import_receipt_items_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipt_items
    ADD CONSTRAINT import_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.import_receipts(id) ON DELETE CASCADE;


--
-- Name: import_receipt_items import_receipt_items_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipt_items
    ADD CONSTRAINT import_receipt_items_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.trays(id);


--
-- Name: import_receipts import_receipts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts
    ADD CONSTRAINT import_receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: inventory inventory_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.trays(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: pick_logs pick_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: pick_logs pick_logs_picked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_picked_by_fkey FOREIGN KEY (picked_by) REFERENCES public.users(id);


--
-- Name: pick_logs pick_logs_picking_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_picking_task_id_fkey FOREIGN KEY (picking_task_id) REFERENCES public.picking_tasks(id);


--
-- Name: pick_logs pick_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: pick_logs pick_logs_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pick_logs
    ADD CONSTRAINT pick_logs_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.trays(id);


--
-- Name: picking_tasks picking_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks
    ADD CONSTRAINT picking_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: picking_tasks picking_tasks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks
    ADD CONSTRAINT picking_tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: picking_tasks picking_tasks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks
    ADD CONSTRAINT picking_tasks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: picking_tasks picking_tasks_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.picking_tasks
    ADD CONSTRAINT picking_tasks_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.trays(id);


--
-- Name: stock_transactions stock_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: stock_transactions stock_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_transactions stock_transactions_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.trays(id);


--
-- Name: trays trays_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays
    ADD CONSTRAINT trays_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: trays trays_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trays
    ADD CONSTRAINT trays_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict HGW6upRc2qbclWXAK1fbCblXCnRltgtWZ6encOaVnG6nFbrvMqbtwOqj1Q8DJu1

