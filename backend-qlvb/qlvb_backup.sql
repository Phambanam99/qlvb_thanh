--
-- PostgreSQL database dump
--

-- Dumped from database version 13.21 (Debian 13.21-1.pgdg120+1)
-- Dumped by pg_dump version 13.21 (Debian 13.21-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.activity_logs (
    document_id bigint,
    id bigint NOT NULL,
    "timestamp" timestamp(6) without time zone NOT NULL,
    user_id bigint,
    work_case_id bigint,
    action_description text,
    action_type character varying(255) NOT NULL,
    additional_data text,
    ip_address character varying(255)
);


ALTER TABLE public.activity_logs OWNER TO admin;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_logs_id_seq OWNER TO admin;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.comments (
    author_id bigint,
    created_at timestamp(6) without time zone,
    document_id bigint,
    id bigint NOT NULL,
    content text
);


ALTER TABLE public.comments OWNER TO admin;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO admin;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: custom_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.custom_roles (
    is_system_role boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by bigint,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.custom_roles OWNER TO admin;

--
-- Name: custom_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.custom_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.custom_roles_id_seq OWNER TO admin;

--
-- Name: custom_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.custom_roles_id_seq OWNED BY public.custom_roles.id;


--
-- Name: department; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.department (
    type_code integer,
    id bigint NOT NULL,
    parent_department_id bigint,
    abbreviation character varying(255),
    dept_group character varying(255),
    email character varying(255),
    external_id character varying(255),
    name character varying(255)
);


ALTER TABLE public.department OWNER TO admin;

--
-- Name: department_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.department_id_seq OWNER TO admin;

--
-- Name: department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.department_id_seq OWNED BY public.department.id;


--
-- Name: document_attachments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_attachments (
    document_id bigint NOT NULL,
    file_size bigint,
    id bigint NOT NULL,
    uploaded_by bigint NOT NULL,
    uploaded_date timestamp(6) without time zone NOT NULL,
    content_type character varying(255),
    description character varying(255),
    file_path character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL
);


ALTER TABLE public.document_attachments OWNER TO admin;

--
-- Name: document_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_attachments_id_seq OWNER TO admin;

--
-- Name: document_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_attachments_id_seq OWNED BY public.document_attachments.id;


--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_comments (
    created timestamp(6) without time zone NOT NULL,
    document_id bigint NOT NULL,
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    comment_type character varying(50),
    content character varying(2000) NOT NULL
);


ALTER TABLE public.document_comments OWNER TO admin;

--
-- Name: document_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_comments_id_seq OWNER TO admin;

--
-- Name: document_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_comments_id_seq OWNED BY public.document_comments.id;


--
-- Name: document_department; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_department (
    is_primary boolean NOT NULL,
    assigned_by bigint,
    assigned_date timestamp(6) without time zone NOT NULL,
    department_id bigint NOT NULL,
    document_id bigint NOT NULL,
    due_date timestamp(6) without time zone,
    id bigint NOT NULL,
    comments text,
    processing_status character varying(255)
);


ALTER TABLE public.document_department OWNER TO admin;

--
-- Name: document_department_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_department_id_seq OWNER TO admin;

--
-- Name: document_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_department_id_seq OWNED BY public.document_department.id;


--
-- Name: document_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_history (
    assigned_to_id bigint,
    document_id bigint NOT NULL,
    id bigint NOT NULL,
    performed_by_id bigint,
    primary_department_id bigint,
    "timestamp" timestamp(6) without time zone NOT NULL,
    action character varying(255) NOT NULL,
    attachment_path character varying(255),
    comments text,
    new_status character varying(255),
    previous_status character varying(255)
);


ALTER TABLE public.document_history OWNER TO admin;

--
-- Name: document_history_collaborating_departments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_history_collaborating_departments (
    department_id bigint NOT NULL,
    document_history_id bigint NOT NULL
);


ALTER TABLE public.document_history_collaborating_departments OWNER TO admin;

--
-- Name: document_history_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_history_id_seq OWNER TO admin;

--
-- Name: document_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_history_id_seq OWNED BY public.document_history.id;


--
-- Name: document_read_status; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_read_status (
    is_read boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    document_id bigint NOT NULL,
    id bigint NOT NULL,
    read_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL,
    document_type character varying(255) NOT NULL,
    CONSTRAINT document_read_status_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['INCOMING_EXTERNAL'::character varying, 'INCOMING_INTERNAL'::character varying, 'OUTGOING_INTERNAL'::character varying, 'OUTGOING_EXTERNAL'::character varying])::text[])))
);


ALTER TABLE public.document_read_status OWNER TO admin;

--
-- Name: document_read_status_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_read_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_read_status_id_seq OWNER TO admin;

--
-- Name: document_read_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_read_status_id_seq OWNED BY public.document_read_status.id;


--
-- Name: document_relationship; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_relationship (
    created_at timestamp(6) without time zone,
    created_by_id bigint,
    id bigint NOT NULL,
    incoming_document_id bigint,
    outgoing_document_id bigint,
    comments character varying(255),
    relationship_type character varying(255)
);


ALTER TABLE public.document_relationship OWNER TO admin;

--
-- Name: document_relationship_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_relationship_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_relationship_id_seq OWNER TO admin;

--
-- Name: document_relationship_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_relationship_id_seq OWNED BY public.document_relationship.id;


--
-- Name: document_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.document_types (
    is_active boolean,
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    name character varying(255) NOT NULL
);


ALTER TABLE public.document_types OWNER TO admin;

--
-- Name: document_types_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.document_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_types_id_seq OWNER TO admin;

--
-- Name: document_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.document_types_id_seq OWNED BY public.document_types.id;


--
-- Name: guide_files; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.guide_files (
    is_active boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by_id bigint,
    file_size bigint NOT NULL,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    category character varying(255) NOT NULL,
    created_by_name character varying(255),
    description text,
    file_name character varying(255) NOT NULL,
    file_type character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.guide_files OWNER TO admin;

--
-- Name: guide_files_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.guide_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.guide_files_id_seq OWNER TO admin;

--
-- Name: guide_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.guide_files_id_seq OWNED BY public.guide_files.id;


--
-- Name: incoming_document; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.incoming_document (
    compute_value integer,
    id bigint NOT NULL,
    processing_officer_id bigint,
    received_date timestamp(6) without time zone,
    closure_request character varying(255),
    email_source character varying(255),
    issuing_authority character varying(255),
    notes character varying(255),
    receipt_number character varying(255),
    security_level character varying(255),
    sending_department_text character varying(255),
    storage_location character varying(255),
    summary character varying(255),
    urgency_level character varying(255)
);


ALTER TABLE public.incoming_document OWNER TO admin;

--
-- Name: internal_document; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.internal_document (
    distribution_type smallint,
    is_secure_transmission boolean,
    no_paper_copy boolean,
    number_of_copies integer,
    number_of_pages integer,
    created_at timestamp(6) without time zone NOT NULL,
    document_signer_id bigint,
    drafting_department_id bigint,
    id bigint NOT NULL,
    number_receive bigint,
    processing_deadline timestamp(6) without time zone,
    reply_to_id bigint,
    sender_id bigint NOT NULL,
    signing_date timestamp(6) without time zone,
    updated_at timestamp(6) without time zone NOT NULL,
    title character varying(2000) NOT NULL,
    document_number character varying(255),
    document_type character varying(255),
    issuing_agency character varying(255),
    notes text,
    security_level character varying(255),
    signer character varying(255),
    status character varying(255) NOT NULL,
    summary text,
    urgency_level character varying(255) NOT NULL,
    CONSTRAINT internal_document_distribution_type_check CHECK (((distribution_type >= 0) AND (distribution_type <= 4))),
    CONSTRAINT internal_document_security_level_check CHECK (((security_level)::text = ANY ((ARRAY['NORMAL'::character varying, 'CONFIDENTIAL'::character varying, 'SECRET'::character varying, 'TOP_SECRET'::character varying])::text[]))),
    CONSTRAINT internal_document_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'REGISTERED'::character varying, 'FORMAT_CORRECTION'::character varying, 'FORMAT_CORRECTED'::character varying, 'DISTRIBUTED'::character varying, 'DEPT_ASSIGNED'::character varying, 'PENDING_APPROVAL'::character varying, 'SPECIALIST_PROCESSING'::character varying, 'SPECIALIST_SUBMITTED'::character varying, 'LEADER_REVIEWING'::character varying, 'LEADER_APPROVED'::character varying, 'LEADER_COMMENTED'::character varying, 'NOT_PROCESSED'::character varying, 'IN_PROCESS'::character varying, 'PROCESSED'::character varying, 'PUBLISHED'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying, 'ARCHIVED'::character varying, 'HEADER_DEPARTMENT_REVIEWING'::character varying, 'HEADER_DEPARTMENT_APPROVED'::character varying, 'HEADER_DEPARTMENT_COMMENTED'::character varying])::text[]))),
    CONSTRAINT internal_document_urgency_level_check CHECK (((urgency_level)::text = ANY ((ARRAY['HOA_TOC'::character varying, 'HOA_TOC_HEN_GIO'::character varying, 'THUONG_KHAN'::character varying, 'KHAN'::character varying, 'THUONG'::character varying])::text[])))
);


ALTER TABLE public.internal_document OWNER TO admin;

--
-- Name: internal_document_attachment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.internal_document_attachment (
    document_id bigint NOT NULL,
    file_size bigint,
    id bigint NOT NULL,
    uploaded_at timestamp(6) without time zone NOT NULL,
    uploaded_by bigint,
    content_type character varying(255),
    description character varying(255),
    file_path character varying(255) NOT NULL,
    filename character varying(255) NOT NULL
);


ALTER TABLE public.internal_document_attachment OWNER TO admin;

--
-- Name: internal_document_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.internal_document_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.internal_document_attachment_id_seq OWNER TO admin;

--
-- Name: internal_document_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.internal_document_attachment_id_seq OWNED BY public.internal_document_attachment.id;


--
-- Name: internal_document_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.internal_document_history (
    document_id bigint NOT NULL,
    id bigint NOT NULL,
    performed_at timestamp(6) without time zone NOT NULL,
    performed_by bigint NOT NULL,
    action character varying(255) NOT NULL,
    details text,
    ip_address character varying(255),
    user_agent character varying(255)
);


ALTER TABLE public.internal_document_history OWNER TO admin;

--
-- Name: internal_document_history_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.internal_document_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.internal_document_history_id_seq OWNER TO admin;

--
-- Name: internal_document_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.internal_document_history_id_seq OWNED BY public.internal_document_history.id;


--
-- Name: internal_document_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.internal_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.internal_document_id_seq OWNER TO admin;

--
-- Name: internal_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.internal_document_id_seq OWNED BY public.internal_document.id;


--
-- Name: internal_document_recipient; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.internal_document_recipient (
    is_read boolean NOT NULL,
    department_id bigint,
    document_id bigint NOT NULL,
    forwarded_at timestamp(6) without time zone,
    forwarded_by bigint,
    id bigint NOT NULL,
    read_at timestamp(6) without time zone,
    received_at timestamp(6) without time zone NOT NULL,
    user_id bigint,
    notes text
);


ALTER TABLE public.internal_document_recipient OWNER TO admin;

--
-- Name: internal_document_recipient_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.internal_document_recipient_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.internal_document_recipient_id_seq OWNER TO admin;

--
-- Name: internal_document_recipient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.internal_document_recipient_id_seq OWNED BY public.internal_document_recipient.id;


--
-- Name: node; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.node (
    status smallint NOT NULL,
    changed timestamp(6) without time zone NOT NULL,
    created timestamp(6) without time zone NOT NULL,
    document_type_id bigint,
    id bigint NOT NULL,
    process_deadline timestamp(6) without time zone,
    signing_date timestamp(6) without time zone,
    uid bigint,
    user_id bigint,
    vid bigint,
    title character varying(2000) NOT NULL,
    attachment_filename character varying(255),
    document_number character varying(255),
    language character varying(255) NOT NULL,
    reference_number character varying(255),
    type character varying(255) NOT NULL,
    CONSTRAINT node_status_check CHECK (((status >= 0) AND (status <= 21)))
);


ALTER TABLE public.node OWNER TO admin;

--
-- Name: node_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.node_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.node_id_seq OWNER TO admin;

--
-- Name: node_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.node_id_seq OWNED BY public.node.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    active boolean,
    is_read boolean NOT NULL,
    read boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    entity_id bigint,
    id bigint NOT NULL,
    user_id bigint,
    content character varying(255) NOT NULL,
    entity_type character varying(255),
    type character varying(255) NOT NULL,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['STATUS_CHANGE'::character varying, 'DEADLINE_REMINDER'::character varying, 'NEW_DOCUMENT'::character varying, 'ASSIGNMENT'::character varying, 'NEW_COMMENT'::character varying, 'DOCUMENT_UPDATE'::character varying, 'INTERNAL_DOCUMENT_SENT'::character varying, 'INTERNAL_DOCUMENT_READ'::character varying, 'INTERNAL_DOCUMENT_RECEIVED'::character varying, 'INTERNAL_DOCUMENT_UPDATED'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: outgoing_document; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.outgoing_document (
    distribution_type smallint,
    is_internal boolean NOT NULL,
    is_secure_transmission boolean,
    no_paper_copy boolean,
    number_of_copies integer,
    number_of_pages integer,
    storage_location integer,
    document_signer_id bigint,
    drafting_department_id bigint,
    id bigint NOT NULL,
    processing_deadline timestamp(6) without time zone,
    signer_id bigint,
    summary character varying(2000),
    document_volume character varying(255),
    drafting_department character varying(255),
    email_address character varying(255),
    get_document_number character varying(255),
    issuing_agency character varying(255),
    receiving_department_text character varying(255),
    related_documents character varying(255),
    resend character varying(255),
    security_level character varying(255),
    CONSTRAINT outgoing_document_distribution_type_check CHECK (((distribution_type >= 0) AND (distribution_type <= 4))),
    CONSTRAINT outgoing_document_security_level_check CHECK (((security_level)::text = ANY ((ARRAY['NORMAL'::character varying, 'CONFIDENTIAL'::character varying, 'SECRET'::character varying, 'TOP_SECRET'::character varying])::text[])))
);


ALTER TABLE public.outgoing_document OWNER TO admin;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.permissions (
    is_system_permission boolean NOT NULL,
    id bigint NOT NULL,
    category character varying(255),
    description character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.permissions OWNER TO admin;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permissions_id_seq OWNER TO admin;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.role_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    rid bigint NOT NULL,
    name character varying(60) NOT NULL,
    description character varying(255),
    display_name character varying(255)
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: roles_rid_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.roles_rid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_rid_seq OWNER TO admin;

--
-- Name: roles_rid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.roles_rid_seq OWNED BY public.roles.rid;


--
-- Name: schedule_event_attendances; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.schedule_event_attendances (
    created_at timestamp(6) without time zone,
    event_id bigint NOT NULL,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    comments text,
    status character varying(255) NOT NULL
);


ALTER TABLE public.schedule_event_attendances OWNER TO admin;

--
-- Name: schedule_event_attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.schedule_event_attendances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schedule_event_attendances_id_seq OWNER TO admin;

--
-- Name: schedule_event_attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.schedule_event_attendances_id_seq OWNED BY public.schedule_event_attendances.id;


--
-- Name: schedule_event_participants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.schedule_event_participants (
    event_id bigint NOT NULL,
    user_id bigint
);


ALTER TABLE public.schedule_event_participants OWNER TO admin;

--
-- Name: schedule_events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.schedule_events (
    date date NOT NULL,
    end_time time(6) without time zone,
    start_time time(6) without time zone,
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    description text,
    location character varying(255),
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL
);


ALTER TABLE public.schedule_events OWNER TO admin;

--
-- Name: schedule_events_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.schedule_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schedule_events_id_seq OWNER TO admin;

--
-- Name: schedule_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.schedule_events_id_seq OWNED BY public.schedule_events.id;


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.schedules (
    approval_date timestamp(6) without time zone,
    approved_by bigint,
    created_at timestamp(6) without time zone,
    created_by bigint,
    department_id bigint,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    approval_comments character varying(255),
    description text,
    period character varying(255),
    status character varying(255) NOT NULL,
    title character varying(255) NOT NULL
);


ALTER TABLE public.schedules OWNER TO admin;

--
-- Name: schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schedules_id_seq OWNER TO admin;

--
-- Name: schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.schedules_id_seq OWNED BY public.schedules.id;


--
-- Name: senders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.senders (
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    description character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.senders OWNER TO admin;

--
-- Name: senders_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.senders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.senders_id_seq OWNER TO admin;

--
-- Name: senders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.senders_id_seq OWNED BY public.senders.id;


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.signatures (
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    file_name character varying(255) NOT NULL,
    image_path character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.signatures OWNER TO admin;

--
-- Name: signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.signatures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.signatures_id_seq OWNER TO admin;

--
-- Name: signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.signatures_id_seq OWNED BY public.signatures.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    is_commander_of_unit boolean NOT NULL,
    status integer NOT NULL,
    access timestamp(6) without time zone,
    created timestamp(6) without time zone,
    department_id bigint,
    id bigint NOT NULL,
    login timestamp(6) without time zone,
    phone character varying(20),
    name character varying(60) NOT NULL,
    mail character varying(64),
    pass character varying(100) NOT NULL,
    full_name character varying(255)
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users_roles (
    rid bigint NOT NULL,
    uid bigint NOT NULL
);


ALTER TABLE public.users_roles OWNER TO admin;

--
-- Name: work_cases; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.work_cases (
    progress integer,
    assigned_to bigint,
    created_by bigint,
    created_date timestamp(6) without time zone NOT NULL,
    deadline timestamp(6) without time zone,
    id bigint NOT NULL,
    last_modified_date timestamp(6) without time zone NOT NULL,
    case_code character varying(255),
    description text,
    priority character varying(255),
    status character varying(255),
    tags character varying(255),
    title character varying(255) NOT NULL
);


ALTER TABLE public.work_cases OWNER TO admin;

--
-- Name: work_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.work_cases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_cases_id_seq OWNER TO admin;

--
-- Name: work_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.work_cases_id_seq OWNED BY public.work_cases.id;


--
-- Name: work_plan_tasks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.work_plan_tasks (
    progress integer,
    assignee_id bigint,
    created_at timestamp(6) without time zone,
    end_date timestamp(6) without time zone,
    id bigint NOT NULL,
    last_updated_by bigint,
    start_date timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    work_plan_id bigint NOT NULL,
    description text,
    status character varying(255) NOT NULL,
    status_comments text,
    title character varying(255) NOT NULL
);


ALTER TABLE public.work_plan_tasks OWNER TO admin;

--
-- Name: work_plan_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.work_plan_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_plan_tasks_id_seq OWNER TO admin;

--
-- Name: work_plan_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.work_plan_tasks_id_seq OWNED BY public.work_plan_tasks.id;


--
-- Name: work_plans; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.work_plans (
    approved_at timestamp(6) without time zone,
    approved_by bigint,
    created_at timestamp(6) without time zone,
    created_by bigint,
    department_id bigint,
    end_date timestamp(6) without time zone,
    id bigint NOT NULL,
    start_date timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    approval_comments text,
    description text,
    status character varying(255) NOT NULL,
    title character varying(255) NOT NULL
);


ALTER TABLE public.work_plans OWNER TO admin;

--
-- Name: work_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.work_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_plans_id_seq OWNER TO admin;

--
-- Name: work_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.work_plans_id_seq OWNED BY public.work_plans.id;


--
-- Name: workcase_documents; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.workcase_documents (
    document_id bigint NOT NULL,
    workcase_id bigint NOT NULL
);


ALTER TABLE public.workcase_documents OWNER TO admin;

--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: custom_roles id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.custom_roles ALTER COLUMN id SET DEFAULT nextval('public.custom_roles_id_seq'::regclass);


--
-- Name: department id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.department ALTER COLUMN id SET DEFAULT nextval('public.department_id_seq'::regclass);


--
-- Name: document_attachments id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_attachments ALTER COLUMN id SET DEFAULT nextval('public.document_attachments_id_seq'::regclass);


--
-- Name: document_comments id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_comments ALTER COLUMN id SET DEFAULT nextval('public.document_comments_id_seq'::regclass);


--
-- Name: document_department id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_department ALTER COLUMN id SET DEFAULT nextval('public.document_department_id_seq'::regclass);


--
-- Name: document_history id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history ALTER COLUMN id SET DEFAULT nextval('public.document_history_id_seq'::regclass);


--
-- Name: document_read_status id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_read_status ALTER COLUMN id SET DEFAULT nextval('public.document_read_status_id_seq'::regclass);


--
-- Name: document_relationship id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_relationship ALTER COLUMN id SET DEFAULT nextval('public.document_relationship_id_seq'::regclass);


--
-- Name: document_types id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_types ALTER COLUMN id SET DEFAULT nextval('public.document_types_id_seq'::regclass);


--
-- Name: guide_files id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.guide_files ALTER COLUMN id SET DEFAULT nextval('public.guide_files_id_seq'::regclass);


--
-- Name: internal_document id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document ALTER COLUMN id SET DEFAULT nextval('public.internal_document_id_seq'::regclass);


--
-- Name: internal_document_attachment id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_attachment ALTER COLUMN id SET DEFAULT nextval('public.internal_document_attachment_id_seq'::regclass);


--
-- Name: internal_document_history id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_history ALTER COLUMN id SET DEFAULT nextval('public.internal_document_history_id_seq'::regclass);


--
-- Name: internal_document_recipient id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient ALTER COLUMN id SET DEFAULT nextval('public.internal_document_recipient_id_seq'::regclass);


--
-- Name: node id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node ALTER COLUMN id SET DEFAULT nextval('public.node_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: roles rid; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN rid SET DEFAULT nextval('public.roles_rid_seq'::regclass);


--
-- Name: schedule_event_attendances id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_event_attendances ALTER COLUMN id SET DEFAULT nextval('public.schedule_event_attendances_id_seq'::regclass);


--
-- Name: schedule_events id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_events ALTER COLUMN id SET DEFAULT nextval('public.schedule_events_id_seq'::regclass);


--
-- Name: schedules id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedules ALTER COLUMN id SET DEFAULT nextval('public.schedules_id_seq'::regclass);


--
-- Name: senders id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.senders ALTER COLUMN id SET DEFAULT nextval('public.senders_id_seq'::regclass);


--
-- Name: signatures id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.signatures ALTER COLUMN id SET DEFAULT nextval('public.signatures_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_cases id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_cases ALTER COLUMN id SET DEFAULT nextval('public.work_cases_id_seq'::regclass);


--
-- Name: work_plan_tasks id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plan_tasks ALTER COLUMN id SET DEFAULT nextval('public.work_plan_tasks_id_seq'::regclass);


--
-- Name: work_plans id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plans ALTER COLUMN id SET DEFAULT nextval('public.work_plans_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.activity_logs (document_id, id, "timestamp", user_id, work_case_id, action_description, action_type, additional_data, ip_address) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.comments (author_id, created_at, document_id, id, content) FROM stdin;
\.


--
-- Data for Name: custom_roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.custom_roles (is_system_role, created_at, created_by, id, updated_at, description, name) FROM stdin;
\.


--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.department (type_code, id, parent_department_id, abbreviation, dept_group, email, external_id, name) FROM stdin;
\N	0	\N	TTT	ACTIVE	\N	0	Thủ trưởng Cục
\N	1	\N	P01	ACTIVE	\N	1	Phòng 1
\N	6	\N	P06	ACTIVE	\N	6	Phòng 6
\N	7	\N	P07	ACTIVE	\N	7	Phòng 7
\N	8	\N	PTM	ACTIVE	\N	8	Phòng Tham mưu
\N	9	\N	PCT	ACTIVE	\N	9	Phòng Chính trị
\N	12	\N	CM4	ACTIVE	\N	12	Cụm 4
\N	13	\N	CM5	ACTIVE	\N	13	Cụm 5
\N	14	\N	UBKT	ACTIVE	\N	14	Ủy Ban Kiểm Tra
\N	16	\N	BTC	ACTIVE	\N	16	Ban Tài Chính
\N	19	8	T_H	ACTIVE	\N	19	Ban Tác Huấn
\N	20	8	Q_L	ACTIVE	\N	20	Ban Quân lực
\N	25	\N	T_T	ACTIVE	\N	25	Trạm TTLL
\N	27	8	H_C	ACTIVE	\N	27	Ban H.Chính
\N	28	8	C_Y	ACTIVE	\N	28	Ban Cơ Yếu
\N	29	\N	T_39	ACTIVE	\N	29	Trạm 39
\N	30	\N	T_31	ACTIVE	\N	30	Trạm 31
\N	31	\N	T_37	ACTIVE	\N	31	Trạm 37
\N	32	\N	K_3	ACTIVE	\N	32	Cụm 3
\N	33	\N	K_35	ACTIVE	\N	33	Cụm 35
\N	34	\N	T_32	ACTIVE	\N	34	Trạm 32
\N	35	32	3_HC	ACTIVE	\N	35	Ban hành chính
\N	36	\N	QY_HC	ACTIVE	\N	36	Ban quân y
\N	37	9	B_TC	ACTIVE	\N	37	Ban Tổ chức
\N	38	9	B_CB	ACTIVE	\N	38	Ban Cán bộ
\N	39	9	B_TYH	ACTIVE	\N	39	Ban Tuyên huấn
\N	40	9	B_CS	ACTIVE	\N	40	Ban Chính sách
\N	41	9	B_DV	ACTIVE	\N	41	Ban Dân vận
\N	42	9	TL-TN	ACTIVE	\N	42	Thanh niên
\N	43	16	BTC	ACTIVE	\N	43	TL-BTC
\N	44	9	TB_CB	ACTIVE	\N	44	Trưởng ban Cán bộ
\N	46	\N	TL_KH	ACTIVE	\N	46	Trợ lý Kế hoạch TSKT
\N	47	\N	P05	ACTIVE	\N	47	Kỹ thuật
\N	48	\N	PHC	ACTIVE	\N	48	Hậu cần
\N	50	8	TL_QS	ACTIVE	\N	50	Trợ lý KHQS
\N	51	\N	P9	ACTIVE	\N	51	Phòng 9
\.


--
-- Data for Name: document_attachments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_attachments (document_id, file_size, id, uploaded_by, uploaded_date, content_type, description, file_path, original_filename, stored_filename) FROM stdin;
\.


--
-- Data for Name: document_comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_comments (created, document_id, id, user_id, comment_type, content) FROM stdin;
\.


--
-- Data for Name: document_department; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_department (is_primary, assigned_by, assigned_date, department_id, document_id, due_date, id, comments, processing_status) FROM stdin;
\.


--
-- Data for Name: document_history; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_history (assigned_to_id, document_id, id, performed_by_id, primary_department_id, "timestamp", action, attachment_path, comments, new_status, previous_status) FROM stdin;
\.


--
-- Data for Name: document_history_collaborating_departments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_history_collaborating_departments (department_id, document_history_id) FROM stdin;
\.


--
-- Data for Name: document_read_status; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_read_status (is_read, created_at, document_id, id, read_at, updated_at, user_id, document_type) FROM stdin;
\.


--
-- Data for Name: document_relationship; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_relationship (created_at, created_by_id, id, incoming_document_id, outgoing_document_id, comments, relationship_type) FROM stdin;
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.document_types (is_active, created_at, id, updated_at, name) FROM stdin;
t	2025-08-05 08:49:13.890331	1	2025-08-05 08:49:13.890331	Kế hoạch
t	2025-08-05 08:49:13.890331	2	2025-08-05 08:49:13.890331	Hướng dẫn
t	2025-08-05 08:49:13.890331	3	2025-08-05 08:49:13.890331	Chỉ thị
t	2025-08-05 08:49:13.890331	4	2025-08-05 08:49:13.890331	Nghị quyết
t	2025-08-05 08:49:13.890331	5	2025-08-05 08:49:13.890331	Thông tư liên tịch
t	2025-08-05 08:49:13.890331	6	2025-08-05 08:49:13.890331	Thông báo
t	2025-08-05 08:49:13.890331	7	2025-08-05 08:49:13.890331	Quyết định
t	2025-08-05 08:49:13.890331	8	2025-08-05 08:49:13.890331	Nghị định
t	2025-08-05 08:49:13.890331	9	2025-08-05 08:49:13.890331	Công văn
t	2025-08-05 08:49:13.890331	10	2025-08-05 08:49:13.890331	Báo cáo
t	2025-08-05 08:49:13.890331	11	2025-08-05 08:49:13.890331	Giấy mời
t	2025-08-05 08:49:13.890331	12	2025-08-05 08:49:13.890331	Quy chế
t	2025-08-05 08:49:13.890331	13	2025-08-05 08:49:13.890331	Quy định
t	2025-08-05 08:49:13.890331	14	2025-08-05 08:49:13.890331	Chương trình
t	2025-08-05 08:49:13.890331	15	2025-08-05 08:49:13.890331	Công điện
t	2025-08-05 08:49:13.890331	20	2025-08-05 08:49:13.890331	Chương trình tuần
t	2025-08-05 08:49:13.890331	21	2025-08-05 08:49:13.890331	Danh sách
t	2025-08-05 08:49:13.890331	22	2025-08-05 08:49:13.890331	Dự trù
t	2025-08-05 08:49:13.890331	23	2025-08-05 08:49:13.890331	Tờ trình
t	2025-08-05 08:49:13.890331	24	2025-08-05 08:49:13.890331	Đề án
t	2025-08-05 08:49:13.890331	25	2025-08-05 08:49:13.890331	Hợp đồng
t	2025-08-05 08:49:13.890331	26	2025-08-05 08:49:13.890331	Biên bản
t	2025-08-05 08:49:13.890331	27	2025-08-05 08:49:13.890331	Giấy chứng nhận
t	2025-08-05 08:49:13.890331	28	2025-08-05 08:49:13.890331	Nhận xét
t	2025-08-05 08:49:13.890331	29	2025-08-05 08:49:13.890331	Chỉ lệnh
t	2025-08-05 08:49:13.890331	30	2025-08-05 08:49:13.890331	Lịch chiếu phim
t	2025-08-05 08:49:13.890331	31	2025-08-05 08:49:13.890331	Dự toán
t	2025-08-05 08:49:13.890331	32	2025-08-05 08:49:13.890331	Phân công nhiệm vụ
t	2025-08-05 08:49:13.890331	33	2025-08-05 08:49:13.890331	Thông tư
t	2025-08-05 08:49:13.890331	34	2025-08-05 08:49:13.890331	Kết luận
t	2025-08-05 08:49:13.890331	35	2025-08-05 08:49:13.890331	Kế hoạch Cụm, Trạm xa
t	2025-08-05 08:49:13.890331	36	2025-08-05 08:49:13.890331	Thư cảm ơn
\.


--
-- Data for Name: guide_files; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.guide_files (is_active, created_at, created_by_id, file_size, id, updated_at, category, created_by_name, description, file_name, file_type, file_url, name) FROM stdin;
\.


--
-- Data for Name: incoming_document; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.incoming_document (compute_value, id, processing_officer_id, received_date, closure_request, email_source, issuing_authority, notes, receipt_number, security_level, sending_department_text, storage_location, summary, urgency_level) FROM stdin;
\.


--
-- Data for Name: internal_document; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.internal_document (distribution_type, is_secure_transmission, no_paper_copy, number_of_copies, number_of_pages, created_at, document_signer_id, drafting_department_id, id, number_receive, processing_deadline, reply_to_id, sender_id, signing_date, updated_at, title, document_number, document_type, issuing_agency, notes, security_level, signer, status, summary, urgency_level) FROM stdin;
\.


--
-- Data for Name: internal_document_attachment; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.internal_document_attachment (document_id, file_size, id, uploaded_at, uploaded_by, content_type, description, file_path, filename) FROM stdin;
\.


--
-- Data for Name: internal_document_history; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.internal_document_history (document_id, id, performed_at, performed_by, action, details, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: internal_document_recipient; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.internal_document_recipient (is_read, department_id, document_id, forwarded_at, forwarded_by, id, read_at, received_at, user_id, notes) FROM stdin;
\.


--
-- Data for Name: node; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.node (status, changed, created, document_type_id, id, process_deadline, signing_date, uid, user_id, vid, title, attachment_filename, document_number, language, reference_number, type) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (active, is_read, read, created_at, entity_id, id, user_id, content, entity_type, type) FROM stdin;
\.


--
-- Data for Name: outgoing_document; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.outgoing_document (distribution_type, is_internal, is_secure_transmission, no_paper_copy, number_of_copies, number_of_pages, storage_location, document_signer_id, drafting_department_id, id, processing_deadline, signer_id, summary, document_volume, drafting_department, email_address, get_document_number, issuing_agency, receiving_department_text, related_documents, resend, security_level) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.permissions (is_system_permission, id, category, description, name) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.role_permissions (permission_id, role_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.roles (rid, name, description, display_name) FROM stdin;
1	ROLE_ADMIN	\N	\N
2	ROLE_USER	\N	\N
3	ROLE_EDITOR	\N	\N
4	ROLE_TRUONG_PHONG	\N	\N
5	ROLE_PHO_PHONG	\N	\N
6	ROLE_CUC_TRUONG	\N	\N
7	ROLE_CUC_PHO	\N	\N
8	ROLE_NHAN_VIEN	\N	\N
9	ROLE_TRO_LY	\N	\N
10	ROLE_VAN_THU	\N	\N
11	ROLE_CHINH_UY	\N	\N
12	ROLE_PHO_CHINH_UY	\N	\N
13	ROLE_TRAM_TRUONG	\N	\N
14	ROLE_PHO_TRAM_TRUONG	\N	\N
15	ROLE_CHINH_TRI_VIEN_TRAM	\N	\N
16	ROLE_CUM_TRUONG	\N	\N
17	ROLE_PHO_CUM_TRUONG	\N	\N
18	ROLE_CHINH_TRI_VIEN_CUM	\N	\N
19	ROLE_TRUONG_BAN	\N	\N
\.


--
-- Data for Name: schedule_event_attendances; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.schedule_event_attendances (created_at, event_id, id, updated_at, user_id, comments, status) FROM stdin;
\.


--
-- Data for Name: schedule_event_participants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.schedule_event_participants (event_id, user_id) FROM stdin;
\.


--
-- Data for Name: schedule_events; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.schedule_events (date, end_time, start_time, created_at, id, schedule_id, updated_at, description, location, title, type) FROM stdin;
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.schedules (approval_date, approved_by, created_at, created_by, department_id, id, updated_at, approval_comments, description, period, status, title) FROM stdin;
\.


--
-- Data for Name: senders; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.senders (created_at, id, updated_at, description, name) FROM stdin;
2025-07-22 15:02:31.627	1	2025-07-22 15:02:31.627	Imported from DM_CQBH	Cục 75
2025-07-22 15:02:31.627	108	2025-07-22 15:02:31.627	Imported from DM_CQBH	Đảng ủy Cục
2025-07-22 15:02:31.627	109	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ủy ban kiểm tra Đảng ủy Cục 75
2025-07-22 15:02:31.627	10401	2025-07-22 15:02:31.627	Imported from DM_CQBH	TL BTC
2025-07-22 15:02:31.627	106	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng 1
2025-07-22 15:02:31.627	101	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng Tham mưu
2025-07-22 15:02:31.627	102	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng Chính trị
2025-07-22 15:02:31.627	10201	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Cán bộ
2025-07-22 15:02:31.627	10202	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Tổ chức
2025-07-22 15:02:31.627	10203	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Chính sách
2025-07-22 15:02:31.627	10204	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Tuyên huấn
2025-07-22 15:02:31.627	10205	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Dân vận
2025-07-22 15:02:31.627	10206	2025-07-22 15:02:31.627	Imported from DM_CQBH	Thanh niên
2025-07-22 15:02:31.627	103	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng Hậu cần
2025-07-22 15:02:31.627	107	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng Kỹ Thuật
2025-07-22 15:02:31.627	110	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng 6
2025-07-22 15:02:31.627	129	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng 9
2025-07-22 15:02:31.627	124	2025-07-22 15:02:31.627	Imported from DM_CQBH	Phòng 7
2025-07-22 15:02:31.627	104	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban Tài chính
2025-07-22 15:02:31.627	114	2025-07-22 15:02:31.627	Imported from DM_CQBH	Cụm 35
2025-07-22 15:02:31.627	127	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 38
2025-07-22 15:02:31.627	111	2025-07-22 15:02:31.627	Imported from DM_CQBH	Cụm 3
2025-07-22 15:02:31.627	112	2025-07-22 15:02:31.627	Imported from DM_CQBH	Cụm 4
2025-07-22 15:02:31.627	113	2025-07-22 15:02:31.627	Imported from DM_CQBH	Cụm 5
2025-07-22 15:02:31.627	128	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 32
2025-07-22 15:02:31.627	125	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 31
2025-07-22 15:02:31.627	126	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 37
2025-07-22 15:02:31.627	122	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 7
2025-07-22 15:02:31.627	123	2025-07-22 15:02:31.627	Imported from DM_CQBH	Trạm 39
2025-07-22 15:02:31.627	116	2025-07-22 15:02:31.627	Imported from DM_CQBH	Ban chỉ đạo 138
\.


--
-- Data for Name: signatures; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.signatures (created_at, id, updated_at, user_id, file_name, image_path, password) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (is_commander_of_unit, status, access, created, department_id, id, login, phone, name, mail, pass, full_name) FROM stdin;
f	1	\N	2025-08-05 08:48:46.070927	\N	1	\N	\N	Admin	admin@system.com	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Administrator
f	1	\N	\N	6	4	\N	\N	admin	truong811@gmail.com	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Nguyễn Mạnh Trường
f	1	\N	\N	27	38	\N	\N	VuQuangPhat	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại úy CN Vũ Quang Phát
f	1	\N	\N	27	39	\N	\N	NguyenThiDu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá CN Nguyễn Thị Du
f	1	\N	\N	27	40	\N	\N	VuTheThuong1	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá CN Vũ Thế Thường1
f	1	\N	\N	27	41	\N	\N	PhamThiChiLe	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá CN Phạm Thị Chi Lê
t	1	\N	\N	41	45	\N	\N	PhamVanHuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phạm Văn Hương
t	1	\N	\N	47	53	\N	\N	TranDucVinh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Trần Đức Vĩnh
f	1	\N	\N	27	58	\N	\N	TrinhThiTamHuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá CN Trịnh Thị Tám Hường
t	1	\N	\N	34	82	\N	\N	NguyenUtThuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Út Thuấn
f	1	\N	\N	6	86	\N	\N	Admin02	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Nguyễn Đức Trung
t	1	\N	\N	33	89	\N	\N	NguyenVanLong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Văn Long
t	1	\N	\N	12	91	\N	\N	NguyenVanHien	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Văn Hiện
f	1	\N	\N	27	95	\N	\N	DoThuTra	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung uý CN Đỗ Thu Trà
f	1	\N	\N	27	106	\N	\N	QuanThiGiang	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng uý CN Quản Thị Giang
t	1	\N	\N	13	111	\N	\N	HoangVanTrong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Hoàng Văn Trọng
t	1	\N	\N	6	115	\N	\N	TaDucCuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Tạ Đức Cường
t	1	\N	\N	48	116	\N	\N	DoVanTan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Đỗ Văn Tân
t	1	\N	\N	13	127	\N	\N	PhamNamSon	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phạm Nam Sơn
t	1	\N	\N	6	128	\N	\N	NguyenHaiLy	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Hải Lý
t	1	\N	\N	13	131	\N	\N	PhamNgocHuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Phạm Ngọc Hương
t	1	\N	\N	6	134	\N	\N	PhamMinhTuan-TP	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phạm Minh Tuấn
t	1	\N	\N	6	135	\N	\N	NinhDuyHanh1	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại Tá Ninh Duy Hạnh (Cũ)
f	1	\N	\N	19	138	\N	\N	BachHongDung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Bạch Hồng Dũng
t	1	\N	\N	14	153	\N	\N	NguyenManhToan01	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Mạnh Toàn
t	1	\N	\N	28	156	\N	\N	NguyenAnhTu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Nguyễn Anh Tú
t	1	\N	\N	0	158	\N	\N	DangHongThi	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Đặng Hồng Thi
t	1	\N	\N	29	159	\N	\N	PhamNgocTruong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phạm Ngọc Trường
t	1	\N	\N	48	164	\N	\N	NguyenTrungKien	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Nguyễn Trung Kiên
t	1	\N	\N	7	166	\N	\N	HaXuanSon	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Hà Xuân Sơn
t	1	\N	\N	6	168	\N	\N	TaToanThang	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Tạ Toàn Thắng
t	1	\N	\N	8	169	\N	\N	NguyenDacQuan_TM	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Đắc Quân
t	1	\N	\N	9	170	\N	\N	VuXuanThao	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Vũ Xuân Thao
t	1	\N	\N	12	171	\N	\N	LamQuangMinh_C4	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Lâm Quang Minh
t	1	\N	\N	19	172	\N	\N	VuTienNguyen	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Vũ Tiến Nguyên
t	1	\N	\N	9	175	\N	\N	PCT_NguyenManhToan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Mạnh Toàn
t	1	\N	\N	36	177	\N	\N	NguyenTaiTrong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Nguyễn Tài Trọng
t	1	\N	\N	37	178	\N	\N	VuVanThanh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Vũ Văn Thạnh
t	1	\N	\N	40	179	\N	\N	TranVanThang	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Trần Văn Thắng
t	1	\N	\N	12	180	\N	\N	NguyenTheHuy	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Thế Huy
t	1	\N	\N	9	181	\N	\N	DoXuanLuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Đỗ Xuân Luân
t	1	\N	\N	38	183	\N	\N	ChuVietThang	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Chu Viết Thắng
f	1	\N	\N	42	185	\N	\N	TranVanHa	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Trần Văn Hà
t	1	\N	\N	16	186	\N	\N	NguyenVietHung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Việt Hùng
t	1	\N	\N	20	187	\N	\N	DangTrungDong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Đặng Trung Đông
t	1	\N	\N	47	189	\N	\N	NguyenDinhCuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Nguyễn Đình Cương
f	1	\N	\N	27	190	\N	\N	PhanCongTuan01	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá  CN Phan Công Tuấn
t	1	\N	\N	47	192	\N	\N	NguyenVanDuc	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Văn Đức
f	1	\N	\N	32	194	\N	\N	BuiVietTam	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá CN Bùi Viết Tâm
t	1	\N	\N	30	195	\N	\N	PhanManhHung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Phan Mạnh Hùng
t	1	\N	\N	0	198	\N	\N	DoanQuangHuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Doãn Quang Huấn
t	1	\N	\N	0	199	\N	\N	PhamMinhTuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phạm Minh Tuấn
t	1	\N	\N	25	201	\N	\N	DoThaiThuy	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Đỗ Thái Thụy
t	1	\N	\N	6	202	\N	\N	NguyenDuyCuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Duy Cường
t	1	\N	\N	39	1203	\N	\N	PhamTienThanh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Phạm Tiến Thành
f	1	\N	\N	27	1204	\N	\N	NguyenThiThu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại uý CN Nguyễn Thị Thư
t	1	\N	\N	31	1206	\N	\N	VuNgocTinh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Vũ Ngọc Tịnh
t	1	\N	\N	25	1207	\N	\N	DauVanPhu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Đậu Văn Phú
t	1	\N	\N	0	1209	\N	\N	DangTatThanh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Đặng Tất Thành
t	1	\N	\N	9	1210	\N	\N	NguyenNgocQuyet	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Ngọc Quyết
t	1	\N	\N	1	1211	\N	\N	NguyenMinhVu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Nguyễn Minh Vũ
f	1	\N	\N	38	1212	\N	\N	DoDucTuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá CN Đỗ Đức Tuấn
t	1	\N	\N	44	1213	\N	\N	ChuVietThang_TB	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Chu Viết Thắng
t	1	\N	\N	30	1216	\N	\N	LeDanhUyenT31	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Lê Danh Uyên
t	1	\N	\N	29	1217	\N	\N	NguyenQuocVan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Quốc Văn
t	1	\N	\N	0	2218	\N	\N	DoanNgocChuc	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tướng Đoàn Ngọc Chúc
t	1	\N	\N	9	2219	\N	\N	VuVanThanh_PCT	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Vũ Văn Thạnh
f	1	\N	\N	37	2220	\N	\N	NguyenVanThan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Nguyễn Văn Thân
f	1	\N	\N	46	2221	\N	\N	DuongLeNgoc	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Dương Lê Ngọc
t	1	\N	\N	31	2222	\N	\N	CaoTienTuan	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Cao Tiến Tuấn
t	1	\N	\N	30	2223	\N	\N	DinhKimTrung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Đinh Kim Trung
t	1	\N	\N	7	2224	\N	\N	NguyenHuuThuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Hữu Thương
f	1	\N	\N	13	2225	\N	\N	TruongHongSon	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thieu ta Truong Hong Son
t	1	\N	\N	7	2226	\N	\N	LeDuyHung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Lê Duy Hưng
t	1	\N	\N	0	2227	\N	\N	PhanVinhGiang	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Đại tá Phan Vĩnh Giang
f	1	\N	\N	39	2228	\N	\N	LeQuyHung	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Lê Quý Hùng
t	1	\N	\N	8	2229	\N	\N	DaoVanThuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Đào Văn Thường
t	1	\N	\N	25	2230	\N	\N	TaDucTam	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng úy Tạ Đức Tâm
f	1	\N	\N	48	2231	\N	\N	NguyenVanNghia	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Trung tá Nguyễn Văn Nghĩa
t	1	\N	\N	12	2232	\N	\N	ThanNgocSon	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Thân Ngọc Sơn
f	1	\N	\N	50	2233	\N	\N	PhanThanhHieu	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu tá Phan Thanh Hiếu
t	1	\N	\N	27	2234	\N	\N	PhamPhuongDong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Phạm Phương Đông
t	1	\N	\N	47	2235	\N	\N	Xuongsuachua	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Xuongsuachua
t	1	\N	\N	51	2236	\N	\N	NguyenCongThanh	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thượng tá Nguyễn Công Thành
f	1	\N	\N	27	2237	\N	\N	NguyenMaiPhuong	\N	$2a$10$CvdAVoI2Zahb4QcAMMwSRuXjwnmbt9omTxPBy9bMCamh5nbtOwVLq	Thiếu úy CN Nguyễn Mai Phương
\.


--
-- Data for Name: users_roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users_roles (rid, uid) FROM stdin;
1	1
\.


--
-- Data for Name: work_cases; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.work_cases (progress, assigned_to, created_by, created_date, deadline, id, last_modified_date, case_code, description, priority, status, tags, title) FROM stdin;
\.


--
-- Data for Name: work_plan_tasks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.work_plan_tasks (progress, assignee_id, created_at, end_date, id, last_updated_by, start_date, updated_at, work_plan_id, description, status, status_comments, title) FROM stdin;
\.


--
-- Data for Name: work_plans; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.work_plans (approved_at, approved_by, created_at, created_by, department_id, end_date, id, start_date, updated_at, approval_comments, description, status, title) FROM stdin;
\.


--
-- Data for Name: workcase_documents; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.workcase_documents (document_id, workcase_id) FROM stdin;
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: custom_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.custom_roles_id_seq', 1, false);


--
-- Name: department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.department_id_seq', 51, true);


--
-- Name: document_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_attachments_id_seq', 1, false);


--
-- Name: document_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_comments_id_seq', 1, false);


--
-- Name: document_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_department_id_seq', 1, false);


--
-- Name: document_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_history_id_seq', 1, false);


--
-- Name: document_read_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_read_status_id_seq', 1, false);


--
-- Name: document_relationship_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_relationship_id_seq', 1, false);


--
-- Name: document_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.document_types_id_seq', 1, false);


--
-- Name: guide_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.guide_files_id_seq', 1, false);


--
-- Name: internal_document_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.internal_document_attachment_id_seq', 1, false);


--
-- Name: internal_document_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.internal_document_history_id_seq', 1, false);


--
-- Name: internal_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.internal_document_id_seq', 1, false);


--
-- Name: internal_document_recipient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.internal_document_recipient_id_seq', 1, false);


--
-- Name: node_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.node_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: roles_rid_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.roles_rid_seq', 19, true);


--
-- Name: schedule_event_attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.schedule_event_attendances_id_seq', 1, false);


--
-- Name: schedule_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.schedule_events_id_seq', 1, false);


--
-- Name: schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.schedules_id_seq', 1, false);


--
-- Name: senders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.senders_id_seq', 10401, true);


--
-- Name: signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.signatures_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_id_seq', 2237, true);


--
-- Name: work_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.work_cases_id_seq', 1, false);


--
-- Name: work_plan_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.work_plan_tasks_id_seq', 1, false);


--
-- Name: work_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.work_plans_id_seq', 1, false);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: custom_roles custom_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_name_key UNIQUE (name);


--
-- Name: custom_roles custom_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_pkey PRIMARY KEY (id);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: document_attachments document_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_attachments
    ADD CONSTRAINT document_attachments_pkey PRIMARY KEY (id);


--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);


--
-- Name: document_department document_department_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_department
    ADD CONSTRAINT document_department_pkey PRIMARY KEY (id);


--
-- Name: document_history_collaborating_departments document_history_collaborating_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history_collaborating_departments
    ADD CONSTRAINT document_history_collaborating_departments_pkey PRIMARY KEY (department_id, document_history_id);


--
-- Name: document_history document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_pkey PRIMARY KEY (id);


--
-- Name: document_read_status document_read_status_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_read_status
    ADD CONSTRAINT document_read_status_pkey PRIMARY KEY (id);


--
-- Name: document_relationship document_relationship_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_relationship
    ADD CONSTRAINT document_relationship_pkey PRIMARY KEY (id);


--
-- Name: document_types document_types_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_name_key UNIQUE (name);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: guide_files guide_files_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.guide_files
    ADD CONSTRAINT guide_files_pkey PRIMARY KEY (id);


--
-- Name: incoming_document incoming_document_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incoming_document
    ADD CONSTRAINT incoming_document_pkey PRIMARY KEY (id);


--
-- Name: internal_document_attachment internal_document_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_attachment
    ADD CONSTRAINT internal_document_attachment_pkey PRIMARY KEY (id);


--
-- Name: internal_document internal_document_document_number_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT internal_document_document_number_key UNIQUE (document_number);


--
-- Name: internal_document_history internal_document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_history
    ADD CONSTRAINT internal_document_history_pkey PRIMARY KEY (id);


--
-- Name: internal_document internal_document_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT internal_document_pkey PRIMARY KEY (id);


--
-- Name: internal_document_recipient internal_document_recipient_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient
    ADD CONSTRAINT internal_document_recipient_pkey PRIMARY KEY (id);


--
-- Name: node node_document_number_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT node_document_number_key UNIQUE (document_number);


--
-- Name: node node_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT node_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: outgoing_document outgoing_document_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.outgoing_document
    ADD CONSTRAINT outgoing_document_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (rid);


--
-- Name: schedule_event_attendances schedule_event_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_event_attendances
    ADD CONSTRAINT schedule_event_attendances_pkey PRIMARY KEY (id);


--
-- Name: schedule_events schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT schedule_events_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: senders senders_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.senders
    ADD CONSTRAINT senders_name_key UNIQUE (name);


--
-- Name: senders senders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.senders
    ADD CONSTRAINT senders_pkey PRIMARY KEY (id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_roles users_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_pkey PRIMARY KEY (rid, uid);


--
-- Name: work_cases work_cases_case_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_cases
    ADD CONSTRAINT work_cases_case_code_key UNIQUE (case_code);


--
-- Name: work_cases work_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_cases
    ADD CONSTRAINT work_cases_pkey PRIMARY KEY (id);


--
-- Name: work_plan_tasks work_plan_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plan_tasks
    ADD CONSTRAINT work_plan_tasks_pkey PRIMARY KEY (id);


--
-- Name: work_plans work_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plans
    ADD CONSTRAINT work_plans_pkey PRIMARY KEY (id);


--
-- Name: workcase_documents workcase_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workcase_documents
    ADD CONSTRAINT workcase_documents_pkey PRIMARY KEY (document_id, workcase_id);


--
-- Name: internal_document_attachment fk15i43kvdjb4eux0txvuihbtw5; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_attachment
    ADD CONSTRAINT fk15i43kvdjb4eux0txvuihbtw5 FOREIGN KEY (document_id) REFERENCES public.internal_document(id);


--
-- Name: document_relationship fk27ej9i4v7tmmj06uhlqults7g; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_relationship
    ADD CONSTRAINT fk27ej9i4v7tmmj06uhlqults7g FOREIGN KEY (incoming_document_id) REFERENCES public.incoming_document(id);


--
-- Name: document_department fk2u3k7exyeesuvthaeni2hx4c3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_department
    ADD CONSTRAINT fk2u3k7exyeesuvthaeni2hx4c3 FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: activity_logs fk3ckogceke1y8twywstp7qqyub; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT fk3ckogceke1y8twywstp7qqyub FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: internal_document fk4sdj7a6xurqpwakrr1kfqpt3m; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT fk4sdj7a6xurqpwakrr1kfqpt3m FOREIGN KEY (drafting_department_id) REFERENCES public.department(id);


--
-- Name: activity_logs fk5bm1lt4f4eevt8lv2517soakd; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT fk5bm1lt4f4eevt8lv2517soakd FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: incoming_document fk5fypbod49pei70401lqb33xal; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incoming_document
    ADD CONSTRAINT fk5fypbod49pei70401lqb33xal FOREIGN KEY (id) REFERENCES public.node(id);


--
-- Name: internal_document_recipient fk5kqyuubx17uvhoq4js013l8yn; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient
    ADD CONSTRAINT fk5kqyuubx17uvhoq4js013l8yn FOREIGN KEY (forwarded_by) REFERENCES public.users(id);


--
-- Name: schedule_event_participants fk6l5tlp9k67qumeylwcfisl50g; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_event_participants
    ADD CONSTRAINT fk6l5tlp9k67qumeylwcfisl50g FOREIGN KEY (event_id) REFERENCES public.schedule_events(id);


--
-- Name: internal_document fk7fp083s9ogcw6aw5hq7d04t5h; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT fk7fp083s9ogcw6aw5hq7d04t5h FOREIGN KEY (reply_to_id) REFERENCES public.internal_document(id);


--
-- Name: internal_document_history fk7jjmm3wp8580apvbse9sj05ow; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_history
    ADD CONSTRAINT fk7jjmm3wp8580apvbse9sj05ow FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: internal_document_recipient fk8eatvil2l9i9tkx3t7d7svlo3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient
    ADD CONSTRAINT fk8eatvil2l9i9tkx3t7d7svlo3 FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: custom_roles fk918yvtitgt2dimq9occxwdsje; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT fk918yvtitgt2dimq9occxwdsje FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: internal_document fk96nfwsl0iwck2uyjx68jflv5e; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT fk96nfwsl0iwck2uyjx68jflv5e FOREIGN KEY (document_signer_id) REFERENCES public.users(id);


--
-- Name: document_history fk9sruodb7wu3wos4qnwear4iu1; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT fk9sruodb7wu3wos4qnwear4iu1 FOREIGN KEY (performed_by_id) REFERENCES public.users(id);


--
-- Name: work_plan_tasks fk9tsg17bg302d8cqhj4jrjr6o6; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plan_tasks
    ADD CONSTRAINT fk9tsg17bg302d8cqhj4jrjr6o6 FOREIGN KEY (work_plan_id) REFERENCES public.work_plans(id);


--
-- Name: notifications fk9y21adhxn0ayjhfocscqox7bh; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk9y21adhxn0ayjhfocscqox7bh FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: department fkbckfslosx7o8kr7bonjq3qaey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT fkbckfslosx7o8kr7bonjq3qaey FOREIGN KEY (parent_department_id) REFERENCES public.department(id);


--
-- Name: internal_document_history fkbs7c8yit6jgmo7cljuc14pb2f; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_history
    ADD CONSTRAINT fkbs7c8yit6jgmo7cljuc14pb2f FOREIGN KEY (document_id) REFERENCES public.internal_document(id);


--
-- Name: node fkcbfsj176g4w2ufbit5tret6vr; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT fkcbfsj176g4w2ufbit5tret6vr FOREIGN KEY (document_type_id) REFERENCES public.document_types(id);


--
-- Name: document_department fkcbvlt9cq7q2oh50ul8yjq1dtc; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_department
    ADD CONSTRAINT fkcbvlt9cq7q2oh50ul8yjq1dtc FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: document_comments fkcls9vjp2ma28rcn877vwe43ll; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT fkcls9vjp2ma28rcn877vwe43ll FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: document_history fkd594cdb09326ows9m30rpxp08; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT fkd594cdb09326ows9m30rpxp08 FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: document_comments fkdmr5933inls4eb998vi7p8mof; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT fkdmr5933inls4eb998vi7p8mof FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: activity_logs fkdx9r4hkv7mcqgev8wmdsm3xf9; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT fkdx9r4hkv7mcqgev8wmdsm3xf9 FOREIGN KEY (work_case_id) REFERENCES public.work_cases(id);


--
-- Name: document_history fke8t1djjxin2pde2xiu6ysxqnv; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT fke8t1djjxin2pde2xiu6ysxqnv FOREIGN KEY (primary_department_id) REFERENCES public.department(id);


--
-- Name: users_roles fkee0mot6r2y47ltnyjcah3r59p; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT fkee0mot6r2y47ltnyjcah3r59p FOREIGN KEY (rid) REFERENCES public.roles(rid);


--
-- Name: role_permissions fkegdk29eiy7mdtefy5c7eirr6e; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkegdk29eiy7mdtefy5c7eirr6e FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions fkfhm3m0e7va24sp8xfh73cf4ht; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkfhm3m0e7va24sp8xfh73cf4ht FOREIGN KEY (role_id) REFERENCES public.custom_roles(id);


--
-- Name: users fkfi832e3qv89fq376fuh8920y4; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkfi832e3qv89fq376fuh8920y4 FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: internal_document_recipient fkfpqso316xc0lrkpxnipwl7w1b; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient
    ADD CONSTRAINT fkfpqso316xc0lrkpxnipwl7w1b FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: internal_document_attachment fkglxpymv4wwpe0m9bvlvj4rwys; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_attachment
    ADD CONSTRAINT fkglxpymv4wwpe0m9bvlvj4rwys FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: document_read_status fkgw7s1p9nqojt1nhm8oo79vgfm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_read_status
    ADD CONSTRAINT fkgw7s1p9nqojt1nhm8oo79vgfm FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_relationship fkha2hnune9jrxvqjq41q6x0ie; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_relationship
    ADD CONSTRAINT fkha2hnune9jrxvqjq41q6x0ie FOREIGN KEY (outgoing_document_id) REFERENCES public.outgoing_document(id);


--
-- Name: document_history_collaborating_departments fki67bte5bbp8y9atksj6c4s3b6; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history_collaborating_departments
    ADD CONSTRAINT fki67bte5bbp8y9atksj6c4s3b6 FOREIGN KEY (document_history_id) REFERENCES public.document_history(id);


--
-- Name: document_history_collaborating_departments fkj4inf0g9u41lm0sntcnoa5xoe; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history_collaborating_departments
    ADD CONSTRAINT fkj4inf0g9u41lm0sntcnoa5xoe FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: document_attachments fkj8srv5tyjrtcj23qdvx86pn69; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_attachments
    ADD CONSTRAINT fkj8srv5tyjrtcj23qdvx86pn69 FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: schedules fkjp4ylrql7om6rh8rm90qbdn9x; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT fkjp4ylrql7om6rh8rm90qbdn9x FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: schedule_event_attendances fkk36aih5c71ers56stlms0ghw2; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_event_attendances
    ADD CONSTRAINT fkk36aih5c71ers56stlms0ghw2 FOREIGN KEY (event_id) REFERENCES public.schedule_events(id);


--
-- Name: internal_document fkkns1srrk3m682pwl630wqbwd8; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document
    ADD CONSTRAINT fkkns1srrk3m682pwl630wqbwd8 FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: comments fkla81ixewxj63358qh8m59q1q7; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fkla81ixewxj63358qh8m59q1q7 FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: work_plans fkldgwgacjb16si5vy8eks6w5u3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plans
    ADD CONSTRAINT fkldgwgacjb16si5vy8eks6w5u3 FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: workcase_documents fklfdcuugp5g6r74roskx85n3xn; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workcase_documents
    ADD CONSTRAINT fklfdcuugp5g6r74roskx85n3xn FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: schedules fkllrf4qb53qvcx00m2eq4d3m70; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT fkllrf4qb53qvcx00m2eq4d3m70 FOREIGN KEY (department_id) REFERENCES public.department(id);


--
-- Name: work_cases fklp0qjooe10dmm50ye62rvaavt; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_cases
    ADD CONSTRAINT fklp0qjooe10dmm50ye62rvaavt FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: internal_document_recipient fkmj2t7nret7712cavl1vbjkljj; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.internal_document_recipient
    ADD CONSTRAINT fkmj2t7nret7712cavl1vbjkljj FOREIGN KEY (document_id) REFERENCES public.internal_document(id);


--
-- Name: incoming_document fkmmbx35n8ubs5tjr7h23urla29; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incoming_document
    ADD CONSTRAINT fkmmbx35n8ubs5tjr7h23urla29 FOREIGN KEY (processing_officer_id) REFERENCES public.users(id);


--
-- Name: work_cases fkmv2npnndbnsrdpp03tyl2abe2; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_cases
    ADD CONSTRAINT fkmv2npnndbnsrdpp03tyl2abe2 FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: node fkmvi2eku3ikqlxqst8r69f74g7; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT fkmvi2eku3ikqlxqst8r69f74g7 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comments fkn2na60ukhs76ibtpt9burkm27; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fkn2na60ukhs76ibtpt9burkm27 FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: schedule_events fkndfm7dh348gvcl1xp378eppe6; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT fkndfm7dh348gvcl1xp378eppe6 FOREIGN KEY (schedule_id) REFERENCES public.schedules(id);


--
-- Name: work_plans fknnarf2kov9hs557bnxx7sbbx8; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plans
    ADD CONSTRAINT fknnarf2kov9hs557bnxx7sbbx8 FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: signatures fkontwx5k1knpn815wxho7hjr88; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT fkontwx5k1knpn815wxho7hjr88 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: schedule_event_attendances fkox6pc8ti696f171qysfnhx2kq; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedule_event_attendances
    ADD CONSTRAINT fkox6pc8ti696f171qysfnhx2kq FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_attachments fkpploi0kul6kgesekpa2cb3kw8; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_attachments
    ADD CONSTRAINT fkpploi0kul6kgesekpa2cb3kw8 FOREIGN KEY (document_id) REFERENCES public.node(id);


--
-- Name: document_history fkpvlcqngotnyvpyu491kx9hgye; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT fkpvlcqngotnyvpyu491kx9hgye FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: schedules fkqfs2dce1rkhu5rhk9t4uimsfp; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT fkqfs2dce1rkhu5rhk9t4uimsfp FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: node fkqjpm2y435518s59ke65pdue1y; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT fkqjpm2y435518s59ke65pdue1y FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- Name: work_plan_tasks fkqrm4axg5bfwh5dkxihm6ej5am; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plan_tasks
    ADD CONSTRAINT fkqrm4axg5bfwh5dkxihm6ej5am FOREIGN KEY (last_updated_by) REFERENCES public.users(id);


--
-- Name: work_plan_tasks fkrdlea7t4wnhbvkmdf64ehme67; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plan_tasks
    ADD CONSTRAINT fkrdlea7t4wnhbvkmdf64ehme67 FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: workcase_documents fkrf87sseh6c9pgs86529a2si5u; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workcase_documents
    ADD CONSTRAINT fkrf87sseh6c9pgs86529a2si5u FOREIGN KEY (workcase_id) REFERENCES public.work_cases(id);


--
-- Name: work_plans fkrnn8ogpr9348efhyo9ids4j6y; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_plans
    ADD CONSTRAINT fkrnn8ogpr9348efhyo9ids4j6y FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: outgoing_document fkrpk00x2yo0tbuuhripsgq3d2g; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.outgoing_document
    ADD CONSTRAINT fkrpk00x2yo0tbuuhripsgq3d2g FOREIGN KEY (signer_id) REFERENCES public.users(id);


--
-- Name: users_roles fkrxg5wjyn6ahtq2vf3fgkpb06r; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT fkrxg5wjyn6ahtq2vf3fgkpb06r FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- Name: outgoing_document fks6kf35bmg2klfrmm6n6rbaru1; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.outgoing_document
    ADD CONSTRAINT fks6kf35bmg2klfrmm6n6rbaru1 FOREIGN KEY (drafting_department_id) REFERENCES public.department(id);


--
-- Name: outgoing_document fkshv22kge44es6cpj64iqvrd2w; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.outgoing_document
    ADD CONSTRAINT fkshv22kge44es6cpj64iqvrd2w FOREIGN KEY (document_signer_id) REFERENCES public.users(id);


--
-- Name: document_department fkt10d2r3e0xuom0ip23rxg2d88; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.document_department
    ADD CONSTRAINT fkt10d2r3e0xuom0ip23rxg2d88 FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: outgoing_document fkw4bwhrhbm0r86qkci9ohpa6j; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.outgoing_document
    ADD CONSTRAINT fkw4bwhrhbm0r86qkci9ohpa6j FOREIGN KEY (id) REFERENCES public.node(id);


--
-- PostgreSQL database dump complete
--

