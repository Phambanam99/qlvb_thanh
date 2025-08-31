package com.managementcontent.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;

@Configuration
public class JacksonConfig {

    // Định nghĩa các MixIn để kiểm soát serialization
    @JsonIgnoreProperties({ "assignedDepartments", "history", "creator" })
    abstract class DocumentMixIn {
    }

    @JsonIgnoreProperties({ "relatedOutgoingDocuments" })
    abstract class IncomingDocumentMixIn {
    }

    @JsonIgnoreProperties({ "relatedIncomingDocuments" })
    abstract class OutgoingDocumentMixIn {
    }

    @JsonIgnoreProperties({ "document", "department", "assignedBy" })
    abstract class DocumentDepartmentMixIn {
    }

    @JsonIgnoreProperties({ "incomingDocument", "outgoingDocument" })
    abstract class DocumentRelationshipMixIn {
    }

    @JsonIgnoreProperties({ "roles", "department", "password", "hibernateLazyInitializer" })
    abstract class UserMixIn {
    }

    @JsonIgnoreProperties({ "documents", "users", "hibernateLazyInitializer" })
    abstract class DepartmentMixIn {
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();

        // Cấu hình cơ bản
        objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

        // Cấu hình quan trọng để giải quyết vấn đề vòng lặp vô hạn
        // ACCEPT_SINGLE_VALUE_AS_ARRAY cho phép mảng một phần tử được xử lý như một đối
        // tượng đơn
        objectMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
        // FAIL_ON_UNKNOWN_PROPERTIES = false để bỏ qua các thuộc tính không có trong
        // model
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // *** ADD CASE-INSENSITIVE ENUM SUPPORT ***
        // Accept case-insensitive enum values (e.g., "high" -> "HIGH")
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS, true);
        // Accept case-insensitive property names
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);

        // Tắt tính năng phát hiện tham chiếu tuần hoàn, sẽ ngăn không cho lỗi vô hạn đệ
        // quy
        // không gây ra lỗi StackOverflowError khi có vòng lặp vô hạn
        objectMapper.disable(SerializationFeature.FAIL_ON_SELF_REFERENCES);

        // *** CẤU HÌNH ĐỘT PHÁ: Sử dụng mixin để xử lý vấn đề đệ quy vô hạn ***
        // Đăng ký các mixin để kiểm soát việc chuyển đổi JSON cho các lớp model
        objectMapper.addMixIn(Document.class, DocumentMixIn.class);
        objectMapper.addMixIn(IncomingDocument.class, IncomingDocumentMixIn.class);
        objectMapper.addMixIn(OutgoingDocument.class, OutgoingDocumentMixIn.class);
        objectMapper.addMixIn(DocumentDepartment.class, DocumentDepartmentMixIn.class);
        objectMapper.addMixIn(DocumentRelationship.class, DocumentRelationshipMixIn.class);
        objectMapper.addMixIn(User.class, UserMixIn.class);
        objectMapper.addMixIn(Department.class, DepartmentMixIn.class);

        // Chỉ sử dụng các getter để serialize, bỏ qua các field
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.NONE);
        objectMapper.setVisibility(PropertyAccessor.GETTER, JsonAutoDetect.Visibility.ANY);

        // Register JavaTimeModule for proper handling of Java 8 date/time types
        objectMapper.registerModule(new JavaTimeModule());
        // Register custom serializers for enums
        SimpleModule simpleModule = new SimpleModule();

        // Add custom serializer for UserRole
        simpleModule.addSerializer(UserRole.class, new JsonSerializer<UserRole>() {
            @Override
            public void serialize(UserRole role, JsonGenerator gen, SerializerProvider provider)
                    throws IOException {
                if (role == null) {
                    gen.writeNull();
                } else {
                    gen.writeString(role.getDisplayName());
                }
            }
        });

        // Add custom serializer for UserStatus
        simpleModule.addSerializer(UserStatus.class, new JsonSerializer<UserStatus>() {
            @Override
            public void serialize(UserStatus status, JsonGenerator gen, SerializerProvider provider)
                    throws IOException {
                if (status == null) {
                    gen.writeNull();
                } else {
                    gen.writeStartObject();
                    gen.writeNumberField("value", status.getValue());
                    gen.writeStringField("name", status.name());
                    gen.writeStringField("displayName", status.getDisplayName());
                    gen.writeEndObject();
                }
            }
        });

        objectMapper.registerModule(simpleModule);

        return objectMapper;
    }

}