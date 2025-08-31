# JSON mẫu để thực hiện các bước trong quy trình

## I. Quy trình quản lý kế hoạch công việc (Work Plan)

### 1. Tạo kế hoạch công việc

**Request:** POST /api/work-plans
```json
{
  "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "description": "Kế hoạch triển khai các giai đoạn chính của dự án Quản lý công văn điện tử cho Quý 3/2025",
  "departmentId": 1,
  "startDate": "2025-07-01T00:00:00",
  "endDate": "2025-09-30T00:00:00",
  "tasks": [
    {
      "title": "Phân tích yêu cầu",
      "description": "Thu thập và phân tích yêu cầu từ người dùng",
      "assigneeId": 2,
      "startDate": "2025-07-01T09:00:00",
      "endDate": "2025-07-15T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "title": "Thiết kế hệ thống",
      "description": "Thiết kế kiến trúc và giao diện hệ thống",
      "assigneeId": 3,
      "startDate": "2025-07-16T09:00:00",
      "endDate": "2025-08-05T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "title": "Lập trình",
      "description": "Phát triển các chức năng của hệ thống",
      "assigneeId": 4,
      "startDate": "2025-08-06T09:00:00",
      "endDate": "2025-09-15T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "title": "Kiểm thử",
      "description": "Kiểm thử các chức năng và sửa lỗi",
      "assigneeId": 5,
      "startDate": "2025-09-16T09:00:00",
      "endDate": "2025-09-30T17:00:00",
      "status": "PENDING",
      "progress": 0
    }
  ]
}
```

**Response:**
```json
{
  "id": 123,
  "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "description": "Kế hoạch triển khai các giai đoạn chính của dự án Quản lý công văn điện tử cho Quý 3/2025",
  "departmentId": 1,
  "departmentName": "Phòng Công nghệ thông tin",
  "startDate": "2025-07-01T00:00:00",
  "endDate": "2025-09-30T00:00:00",
  "status": "DRAFT",
  "createdById": 1,
  "createdByName": "Nguyễn Văn A",
  "createdAt": "2025-05-20T10:15:23",
  "updatedAt": "2025-05-20T10:15:23",
  "tasks": [
    {
      "id": 456,
      "title": "Phân tích yêu cầu",
      "description": "Thu thập và phân tích yêu cầu từ người dùng",
      "assigneeId": 2,
      "assigneeName": "Trần Thị B",
      "startDate": "2025-07-01T09:00:00",
      "endDate": "2025-07-15T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "id": 457,
      "title": "Thiết kế hệ thống",
      "description": "Thiết kế kiến trúc và giao diện hệ thống",
      "assigneeId": 3,
      "assigneeName": "Lê Văn C",
      "startDate": "2025-07-16T09:00:00",
      "endDate": "2025-08-05T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "id": 458,
      "title": "Lập trình",
      "description": "Phát triển các chức năng của hệ thống",
      "assigneeId": 4,
      "assigneeName": "Phạm Thị D",
      "startDate": "2025-08-06T09:00:00",
      "endDate": "2025-09-15T17:00:00",
      "status": "PENDING",
      "progress": 0
    },
    {
      "id": 459,
      "title": "Kiểm thử",
      "description": "Kiểm thử các chức năng và sửa lỗi",
      "assigneeId": 5,
      "assigneeName": "Hoàng Văn E",
      "startDate": "2025-09-16T09:00:00",
      "endDate": "2025-09-30T17:00:00",
      "status": "PENDING",
      "progress": 0
    }
  ]
}
```

### 2. Gửi kế hoạch công việc để phê duyệt

**Request:** PATCH /api/work-plans/123/submit
```json
{
  // Không cần body
}
```

**Response:**
```json
{
  "id": 123,
  "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "status": "SUBMITTED",
  "updatedAt": "2025-05-20T10:30:15",
  "message": "Kế hoạch đã được gửi để phê duyệt"
}
```

### 3. Phê duyệt kế hoạch công việc

**Request:** PATCH /api/work-plans/123/approve
```json
{
  "approved": true,
  "comments": "Kế hoạch hợp lý, đồng ý triển khai"
}
```

**Response:**
```json
{
  "id": 123,
  "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "status": "APPROVED",
  "approvedById": 10,
  "approvedByName": "Vũ Minh G",
  "approvedAt": "2025-05-21T09:15:23",
  "approvalComments": "Kế hoạch hợp lý, đồng ý triển khai",
  "updatedAt": "2025-05-21T09:15:23",
  "message": "Kế hoạch đã được phê duyệt"
}
```

**Từ chối phê duyệt:**
```json
{
  "approved": false,
  "comments": "Cần điều chỉnh lại thời gian cho giai đoạn kiểm thử"
}
```

**Response:**
```json
{
  "id": 123,
  "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "status": "REJECTED",
  "approvedById": 10,
  "approvedByName": "Vũ Minh G",
  "approvedAt": "2025-05-21T09:15:23",
  "approvalComments": "Cần điều chỉnh lại thời gian cho giai đoạn kiểm thử",
  "updatedAt": "2025-05-21T09:15:23",
  "message": "Kế hoạch đã bị từ chối"
}
```

### 5. Cập nhật tiến độ nhiệm vụ

**Request:** PATCH /api/work-plans/123/tasks/456/status
```json
{
  "status": "IN_PROGRESS",
  "progress": 30,
  "comments": "Đã hoàn thành phỏng vấn người dùng và đang tổng hợp yêu cầu"
}
```

**Response:**
```json
{
  "id": 456,
  "title": "Phân tích yêu cầu",
  "status": "IN_PROGRESS",
  "progress": 30,
  "statusComments": "Đã hoàn thành phỏng vấn người dùng và đang tổng hợp yêu cầu",
  "lastUpdatedById": 2,
  "lastUpdatedByName": "Trần Thị B",
  "updatedAt": "2025-07-05T16:20:45",
  "message": "Đã cập nhật trạng thái nhiệm vụ"
}
```

## II. Quy trình quản lý lịch công việc (Schedule)

### 1. Tạo lịch công việc

**Request:** POST /api/schedules
```json
{
  "title": "Lịch công tác tháng 8/2025",
  "description": "Lịch họp và sự kiện của phòng CNTT trong tháng 8/2025",
  "departmentId": 1,
  "events": [
    {
      "title": "Họp giao ban đầu tháng",
      "description": "Đánh giá kết quả tháng 7 và triển khai kế hoạch tháng 8",
      "date": "2025-08-01",
      "startTime": "09:00",
      "endTime": "11:00",
      "location": "Phòng họp A",
      "type": "MEETING",
      "participants": [1, 2, 3, 4, 5]
    },
    {
      "title": "Demo tiến độ dự án QLVB",
      "description": "Trình bày với khách hàng về tiến độ thiết kế hệ thống",
      "date": "2025-08-07",
      "startTime": "14:00",
      "endTime": "16:30",
      "location": "Phòng họp khách hàng",
      "type": "PRESENTATION",
      "participants": [1, 3, 10, 12]
    },
    {
      "title": "Đào tạo công nghệ mới",
      "description": "Đào tạo về microservices và container",
      "date": "2025-08-15",
      "startTime": "09:00",
      "endTime": "17:00",
      "location": "Phòng đào tạo",
      "type": "TRAINING",
      "participants": [2, 3, 4, 5, 6]
    },
    {
      "title": "Họp đánh giá giữa tháng",
      "description": "Kiểm điểm tiến độ công việc giữa tháng",
      "date": "2025-08-15",
      "startTime": "17:00",
      "endTime": "18:00",
      "location": "Phòng họp B",
      "type": "MEETING",
      "participants": [1, 2, 3, 4, 5]
    }
  ]
}
```

**Response:**
```json
{
  "id": 78,
  "title": "Lịch công tác tháng 8/2025",
  "description": "Lịch họp và sự kiện của phòng CNTT trong tháng 8/2025",
  "departmentId": 1,
  "departmentName": "Phòng Công nghệ thông tin",
  "status": "DRAFT",
  "createdById": 1,
  "createdByName": "Nguyễn Văn A",
  "createdAt": "2025-07-20T14:25:12",
  "updatedAt": "2025-07-20T14:25:12",
  "events": [
    {
      "id": 201,
      "title": "Họp giao ban đầu tháng",
      "description": "Đánh giá kết quả tháng 7 và triển khai kế hoạch tháng 8",
      "date": "2025-08-01",
      "startTime": "09:00",
      "endTime": "11:00",
      "location": "Phòng họp A",
      "type": "MEETING",
      "participants": [1, 2, 3, 4, 5],
      "participantNames": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"]
    },
    {
      "id": 202,
      "title": "Demo tiến độ dự án QLVB",
      "description": "Trình bày với khách hàng về tiến độ thiết kế hệ thống",
      "date": "2025-08-07",
      "startTime": "14:00",
      "endTime": "16:30",
      "location": "Phòng họp khách hàng",
      "type": "PRESENTATION",
      "participants": [1, 3, 10, 12],
      "participantNames": ["Nguyễn Văn A", "Lê Văn C", "Vũ Minh G", "Nguyễn Thị H"]
    },
    {
      "id": 203,
      "title": "Đào tạo công nghệ mới",
      "description": "Đào tạo về microservices và container",
      "date": "2025-08-15",
      "startTime": "09:00",
      "endTime": "17:00",
      "location": "Phòng đào tạo",
      "type": "TRAINING",
      "participants": [2, 3, 4, 5, 6],
      "participantNames": ["Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E", "Đỗ Văn F"]
    },
    {
      "id": 204,
      "title": "Họp đánh giá giữa tháng",
      "description": "Kiểm điểm tiến độ công việc giữa tháng",
      "date": "2025-08-15",
      "startTime": "17:00",
      "endTime": "18:00",
      "location": "Phòng họp B",
      "type": "MEETING",
      "participants": [1, 2, 3, 4, 5],
      "participantNames": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"]
    }
  ]
}
```

### 2. Gửi lịch công việc để phê duyệt

**Request:** PATCH /api/schedules/78/submit
```json
{
  // Không cần body
}
```

**Response:**
```json
{
  "id": 78,
  "title": "Lịch công tác tháng 8/2025",
  "status": "SUBMITTED",
  "updatedAt": "2025-07-20T14:35:22",
  "message": "Lịch công tác đã được gửi để phê duyệt"
}
```

### 3. Phê duyệt lịch công việc

**Request:** PATCH /api/schedules/78/approve
```json
{
  "approved": true,
  "comments": "Đã xem xét và phê duyệt lịch công tác tháng 8"
}
```

**Response:**
```json
{
  "id": 78,
  "title": "Lịch công tác tháng 8/2025",
  "status": "APPROVED",
  "approvedById": 10,
  "approvedByName": "Vũ Minh G",
  "approvalDate": "2025-07-21T10:05:18",
  "approvalComments": "Đã xem xét và phê duyệt lịch công tác tháng 8",
  "updatedAt": "2025-07-21T10:05:18",
  "message": "Lịch công tác đã được phê duyệt"
}
```

### 5. Xác nhận tham dự sự kiện

**Request:** PATCH /api/schedules/events/201/attendance
```json
{
  "userId": 2,
  "status": "CONFIRMED",
  "comments": "Tôi sẽ tham dự đầy đủ"
}
```

**Response:**
```json
{
  "eventId": 201,
  "userId": 2,
  "status": "CONFIRMED",
  "comments": "Tôi sẽ tham dự đầy đủ",
  "updatedAt": "2025-07-30T09:12:45",
  "message": "Đã cập nhật trạng thái tham dự"
}
```

**Trường hợp từ chối tham dự:**
```json
{
  "userId": 5,
  "status": "DECLINED",
  "comments": "Tôi có công tác ở chi nhánh miền Nam nên không thể tham dự"
}
```

## III. Quy trình tích hợp kế hoạch và lịch công việc

### 1. Tạo sự kiện từ nhiệm vụ kế hoạch

**Request:** POST /api/schedules/events/from-task
```json
{
  "taskId": 456,
  "title": "Họp rà soát yêu cầu dự án",
  "description": "Họp thảo luận về các yêu cầu đã thu thập và phân tích",
  "date": "2025-07-10",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Phòng họp C",
  "type": "MEETING",
  "participants": [1, 2, 3, 10]
}
```

**Response:**
```json
{
  "id": 205,
  "taskId": 456,
  "title": "Họp rà soát yêu cầu dự án",
  "description": "Họp thảo luận về các yêu cầu đã thu thập và phân tích",
  "date": "2025-07-10",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Phòng họp C",
  "type": "MEETING",
  "participants": [1, 2, 3, 10],
  "participantNames": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Vũ Minh G"],
  "workPlanTitle": "Kế hoạch triển khai dự án QLVB Q3/2025",
  "taskTitle": "Phân tích yêu cầu",
  "createdAt": "2025-07-07T10:22:15",
  "message": "Đã tạo sự kiện từ nhiệm vụ trong kế hoạch"
}
```

### 2. Theo dõi tổng hợp trên Dashboard

**Request:** GET /api/dashboard
```json
{
  "departmentId": 1,
  "fromDate": "2025-07-01",
  "toDate": "2025-09-30"
}
```

**Response:**
```json
{
  "totalDocuments": 152,
  "incomingDocumentCount": 98,
  "outgoingDocumentCount": 54,
  "pendingDocumentCount": 23,
  "overdueDocumentCount": 5,
  "workPlans": {
    "total": 3,
    "draft": 0,
    "submitted": 1,
    "approved": 2,
    "rejected": 0,
    "completed": 0,
    "schedules": 5,
    "upcomingEvents": 12,
    "todayEvents": 2
  },
  "performanceMetrics": {
    "documentAvgProcessingTime": 3.5,
    "documentCompletionRate": 85,
    "taskCompletionRate": 68,
    "overdueTasksPercent": 12
  },
  "activeWorkPlans": [
    {
      "id": 123,
      "title": "Kế hoạch triển khai dự án QLVB Q3/2025",
      "startDate": "2025-07-01T00:00:00",
      "endDate": "2025-09-30T00:00:00",
      "completedTasks": 1,
      "totalTasks": 4,
      "progress": 15
    },
    {
      "id": 124,
      "title": "Kế hoạch bảo trì hệ thống Q3/2025",
      "startDate": "2025-07-15T00:00:00",
      "endDate": "2025-09-15T00:00:00",
      "completedTasks": 0,
      "totalTasks": 3,
      "progress": 0
    }
  ],
  "todayEvents": [
    {
      "id": 206,
      "title": "Họp với khách hàng",
      "startTime": "14:00",
      "endTime": "15:30",
      "location": "Phòng họp khách"
    },
    {
      "id": 207,
      "title": "Báo cáo tiến độ dự án",
      "startTime": "16:00",
      "endTime": "17:00",
      "location": "Phòng họp nội bộ"
    }
  ]
}
```

## IV. Các API hỗ trợ khác

### Lấy danh sách sự kiện trong ngày

**Request:** GET /api/schedules/events/daily
```json
{
  "date": "2025-08-15",
  "departmentId": 1
}
```

**Response:**
```json
[
  {
    "id": 203,
    "title": "Đào tạo công nghệ mới",
    "description": "Đào tạo về microservices và container",
    "date": "2025-08-15",
    "startTime": "09:00",
    "endTime": "17:00",
    "location": "Phòng đào tạo",
    "type": "TRAINING",
    "participants": [2, 3, 4, 5, 6],
    "participantNames": ["Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E", "Đỗ Văn F"],
    "schedule": {
      "id": 78,
      "title": "Lịch công tác tháng 8/2025"
    }
  },
  {
    "id": 204,
    "title": "Họp đánh giá giữa tháng",
    "description": "Kiểm điểm tiến độ công việc giữa tháng",
    "date": "2025-08-15",
    "startTime": "17:00",
    "endTime": "18:00",
    "location": "Phòng họp B",
    "type": "MEETING",
    "participants": [1, 2, 3, 4, 5],
    "participantNames": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"],
    "schedule": {
      "id": 78,
      "title": "Lịch công tác tháng 8/2025"
    }
  }
]
```

### Lấy danh sách sự kiện trong tháng

**Request:** GET /api/schedules/events/monthly
```json
{
  "year": 2025,
  "month": 8,
  "departmentId": 1
}
```

**Response:**
```json
{
  "2025-08-01": [
    {
      "id": 201,
      "title": "Họp giao ban đầu tháng",
      "startTime": "09:00",
      "endTime": "11:00",
      "location": "Phòng họp A",
      "type": "MEETING"
    }
  ],
  "2025-08-07": [
    {
      "id": 202,
      "title": "Demo tiến độ dự án QLVB",
      "startTime": "14:00",
      "endTime": "16:30",
      "location": "Phòng họp khách hàng",
      "type": "PRESENTATION"
    }
  ],
  "2025-08-15": [
    {
      "id": 203,
      "title": "Đào tạo công nghệ mới",
      "startTime": "09:00",
      "endTime": "17:00",
      "location": "Phòng đào tạo",
      "type": "TRAINING"
    },
    {
      "id": 204,
      "title": "Họp đánh giá giữa tháng",
      "startTime": "17:00",
      "endTime": "18:00",
      "location": "Phòng họp B",
      "type": "MEETING"
    }
  ]
}
```

### Lấy thống kê hiệu suất công việc

**Request:** GET /api/dashboard/work-plans/progress
```json
{
  "departmentId": 1,
  "period": "QUARTERLY"
}
```

**Response:**
```json
{
  "period": "Q3/2025",
  "totalWorkPlans": 3,
  "completedWorkPlans": 0,
  "totalTasks": 12,
  "completedTasks": 3,
  "inProgressTasks": 5,
  "pendingTasks": 4,
  "overdueTasks": 0,
  "averageTaskCompletion": 25,
  "tasksByStatus": {
    "PENDING": 4,
    "IN_PROGRESS": 5,
    "COMPLETED": 3
  },
  "tasksByAssignee": [
    {
      "assigneeId": 2,
      "assigneeName": "Trần Thị B",
      "totalTasks": 3,
      "completedTasks": 1,
      "completionRate": 33
    },
    {
      "assigneeId": 3,
      "assigneeName": "Lê Văn C",
      "totalTasks": 4,
      "completedTasks": 1,
      "completionRate": 25
    },
    {
      "assigneeId": 4,
      "assigneeName": "Phạm Thị D",
      "totalTasks": 3,
      "completedTasks": 1,
      "completionRate": 33
    },
    {
      "assigneeId": 5,
      "assigneeName": "Hoàng Văn E",
      "totalTasks": 2,
      "completedTasks": 0,
      "completionRate": 0
    }
  ]
}
```

### Lấy thống kê sự kiện theo phòng ban

**Request:** GET /api/dashboard/schedules/statistics
```json
{
  "departmentId": 1,
  "fromDate": "2025-07-01",
  "toDate": "2025-09-30"
}
```

**Response:**
```json
{
  "totalEvents": 18,
  "eventsByType": {
    "MEETING": 10,
    "TRAINING": 3,
    "PRESENTATION": 2,
    "BUSINESS_TRIP": 2,
    "OTHER": 1
  },
  "attendanceStatistics": {
    "totalParticipants": 87,
    "confirmedAttendance": 62,
    "declinedAttendance": 8,
    "noResponseCount": 17
  },
  "eventsByMonth": {
    "2025-07": 5,
    "2025-08": 8,
    "2025-09": 5
  },
  "topParticipants": [
    {
      "userId": 1,
      "userName": "Nguyễn Văn A",
      "eventCount": 15
    },
    {
      "userId": 3,
      "userName": "Lê Văn C",
      "eventCount": 12
    },
    {
      "userId": 2,
      "userName": "Trần Thị B",
      "eventCount": 10
    },
    {
      "userId": 10,
      "userName": "Vũ Minh G",
      "eventCount": 8
    },
    {
      "userId": 4,
      "userName": "Phạm Thị D",
      "eventCount": 7
    }
  ]
}
```

