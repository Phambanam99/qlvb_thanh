Phambanam99: #codebase phân tích chi tiết về thông báo trong ứng dụng này

GitHub Copilot: Okay, I will help you with that. I will start by analyzing the documentation you have about real-time notifications and then I will look for the relevant code. Okay, I will start by analyzing the notification functionality in this application.

First, I'll look for any documentation related to real-time notifications. Then, I'll search the codebase for the term "notification" to find relevant files and code snippets. This should give us a good overview of how notifications are implemented. Để phân tích chi tiết về hệ thống thông báo trong ứng dụng của bạn, tôi sẽ bắt đầu bằng cách tìm kiếm các cấu hình và trình xử lý WebSocket ở phía backend. Dựa trên tệp `docs/REALTIME_NOTIFICATIONS.md`, có vẻ như hệ thống sử dụng WebSocket để gửi thông báo thời gian thực.

Tôi sẽ tìm kiếm mã nguồn liên quan đến "WebSocket", "Notification", và các loại thông báo cụ thể như "STATUS_CHANGE" để xác định cách chúng được triển khai.

Bắt đầu với việc tìm kiếm các tệp cấu hình WebSocket. Chào bạn, để phân tích chi tiết về hệ thống thông báo trong ứng dụng, tôi sẽ tìm và tổng hợp các phần code có liên quan.

Dựa vào tệp `docs/REALTIME_NOTIFICATIONS.md`, hệ thống sử dụng WebSocket để gửi thông báo thời gian thực. Tôi sẽ bắt đầu bằng cách xem xét cấu hình WebSocket.

Tôi đã tìm thấy file cấu hình `WebSocketConfig.java` có chứa `WebSocketMessageBrokerConfigurer`, đây là một thành phần quan trọng trong việc thiết lập WebSocket với Spring.

Bây giờ, tôi sẽ đọc nội dung của file này để hiểu cách máy chủ WebSocket được cấu hình. Chào bạn, để phân tích chi tiết về hệ thống thông báo trong ứng dụng của bạn, tôi sẽ bắt đầu bằng cách xem xét tài liệu và cấu hình liên quan.

Dưới đây là tài liệu về thông báo thời gian thực, trong đó mô tả cấu trúc tin nhắn, luồng hoạt động và cách xử lý các loại thông báo khác nhau:

<file-contents path="c:\Users\NamP7\Documents\qlvb\backend-qlvb\docs\REALTIME_NOTIFICATIONS.md" />

Tiếp theo, đây là file cấu hình WebSocket, cho thấy cách ứng dụng thiết lập giao thức STOMP qua WebSocket để giao tiếp thời gian thực:

<file-contents path="c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\config\WebSocketConfig.java" />

Từ hai file này, chúng ta có thể thấy rằng:
- Ứng dụng sử dụng WebSocket với STOMP để gửi thông báo thời gian thực.
- Endpoint để kết nối WebSocket là `/ws`.
- Các thông báo được gửi đến client qua topic `/topic`.
- Client gửi tin nhắn đến server qua prefix `/app`.
- Có nhiều loại thông báo được định nghĩa, ví dụ: `STATUS_CHANGE`, `DOCUMENT_ASSIGNMENT`, `NEW_COMMENT`, và `DEADLINE_REMINDER`.

Để hiểu rõ hơn về cách các thông báo này được tạo và gửi từ phía backend, tôi sẽ cần tìm các đoạn code sử dụng `SimpMessagingTemplate` để gửi tin nhắn đến message broker, cũng như các service và controller liên quan đến "Notification".I will now begin my analysis of the application's notification system.

First, I will search the codebase for keywords related to notifications to locate the core logic, such as controllers, services, and models. This will help me understand how notifications are processed on the backend. 

Phambanam99: @agent Try Again

GitHub Copilot: Okay, I will perform a detailed analysis of the notification functionality in this application.

First, I will search the workspace for files related to notifications to understand the implementation. Dựa trên kết quả phân tích mã nguồn và tài liệu của ứng dụng, hệ thống thông báo được xây dựng khá toàn diện, bao gồm các thành phần chính sau:

### 1. Cấu trúc cốt lõi của Thông báo (Notification)

Hệ thống thông báo xoay quanh các thành phần chính trong package `com.managementcontent.model` và `com.managementcontent.service`.

*   **Entity Notification.java**: Đây là model chính định nghĩa cấu trúc của một thông báo trong cơ sở dữ liệu.
    *   `id`: Mã định danh duy nhất.
    *   `type` (enum `NotificationType`): Loại thông báo.
    *   `content`: Nội dung chi tiết của thông báo.
    *   `createdAt`: Thời điểm tạo thông báo.
    *   `isRead`: Trạng thái đã đọc hay chưa.
    *   `user`: Người dùng nhận thông báo.
    *   `document`: Văn bản liên quan đến thông báo (nếu có).

*   **Enum NotificationType.java**: Định nghĩa các loại thông báo mà hệ thống có thể tạo ra:
    *   `STATUS_CHANGE`: Thay đổi trạng thái của văn bản.
    *   `DEADLINE_REMINDER`: Nhắc nhở khi sắp đến hạn xử lý.
    *   `NEW_DOCUMENT`: Có văn bản mới được tạo.
    *   `ASSIGNMENT`: Được giao xử lý một văn bản.
    *   `NEW_COMMENT`: Có bình luận mới trong văn bản.
    *   `DOCUMENT_UPDATE`: Thông tin văn bản được cập nhật.

*   **Repository NotificationRepository.java**: Cung cấp các phương thức truy vấn cơ sở dữ liệu cho `Notification`, bao gồm:
    *   `findByUser(User user, Pageable pageable)`: Lấy danh sách thông báo của người dùng theo phân trang.
    *   `countByUserIdAndReadFalse(Long userId)`: Đếm số lượng thông báo chưa đọc của người dùng.

### 2. Luồng tạo và gửi thông báo

*   **NotificationService.java**: Đây là service trung tâm, chịu trách nhiệm tạo và gửi thông báo.
    *   Phương thức `createAndSendNotification` là hạt nhân của service này. Nó nhận vào các tham số (`document`, `user`, `type`, `content`), tạo một đối tượng `Notification`, lưu vào cơ sở dữ liệu thông qua `NotificationRepository`, và sau đó gửi đi theo thời gian thực.

*   **Gửi thông báo Real-time**: Service sử dụng `SimpMessagingTemplate` để đẩy thông báo tới client thông qua WebSocket.
    *   Thông báo được gửi đến một kênh riêng của mỗi người dùng (`/queue/notifications`).
    *   Điều này cho phép giao diện người dùng (frontend) có thể nhận và hiển thị thông báo ngay lập tức mà không cần tải lại trang.

*   **Nguồn kích hoạt thông báo**:
    *   **DocumentWorkflowService.java**: Đây là nơi chính kích hoạt việc tạo thông báo. Ví dụ, khi trạng thái của một văn bản thay đổi (`changeDocumentStatus`), service này sẽ gọi `notificationService.createAndSendNotification` để thông báo cho người dùng liên quan.
    *   **DocumentEvent.java**: Hệ thống cũng sử dụng cơ chế sự kiện của Spring (`ApplicationEvent`). `DocumentEvent` được tạo ra cho các hành động như `STATUS_CHANGE`, `ASSIGNMENT`, `DOCUMENT_CREATED`. Rất có thể có một `EventListener` (không xuất hiện trong kết quả tìm kiếm) lắng nghe các sự kiện này và gọi `NotificationService` để gửi thông báo tương ứng.

### 3. Tích hợp phía Frontend và Real-time

Tài liệu REALTIME_NOTIFICATIONS.md cung cấp một hướng dẫn chi tiết cho việc tích hợp phía frontend:

*   **Cấu trúc tin nhắn (Message Structure)**: Định nghĩa rõ ràng cấu trúc JSON cho các tin nhắn WebSocket, bao gồm tin nhắn xác thực (AUTH) và payload của thông báo. Payload chứa đầy đủ thông tin cần thiết để hiển thị, như `id`, `type`, `content`, thông tin văn bản, và `metadata` (ví dụ: trạng thái cũ và mới).
*   **Luồng hoạt động (Sequence Flow)**: Mô tả quá trình kết nối WebSocket, xác thực, và nhận thông báo từ backend.
*   **Xử lý theo loại thông báo**: Cung cấp các đoạn mã JavaScript mẫu để xử lý từng loại thông báo khác nhau trên giao diện, ví dụ:
    *   `handleStatusChange`: Cập nhật trạng thái văn bản trên UI và hiển thị toast notification.
    *   `handleAssignment`: Thêm công việc mới vào danh sách của người dùng.
    *   `handleNewComment`: Hiển thị bình luận mới.
    *   `handleDeadline`: Hiển thị cảnh báo sắp đến hạn.

### 4. Truy xuất lịch sử thông báo

*   **NotificationController.java**: Cung cấp một API endpoint (`GET /api/notifications`) để người dùng có thể truy xuất lịch sử thông báo của mình.
*   API này trả về một danh sách thông báo đã được phân trang, cho phép client hiển thị lịch sử một cách hiệu quả.

### Tổng kết

Hệ thống thông báo được thiết kế theo kiến trúc hướng sự kiện và thời gian thực, tích hợp chặt chẽ với các quy trình nghiệp vụ chính (đặc biệt là quy trình xử lý văn bản). Việc sử dụng WebSocket giúp nâng cao trải nghiệm người dùng bằng cách cung cấp phản hồi tức thì. Tài liệu rõ ràng cũng là một điểm cộng, giúp cho việc phát triển và bảo trì phía frontend trở nên dễ dàng hơn.

Phambanam99: #codebase #file:REALTIME_NOTIFICATIONS.md tôi thấy trong văn bản nội bộ chưa được triển khai notifications?

GitHub Copilot: Okay, I will help you with that. It seems you're asking whether the real-time notification system has been implemented for "văn bản nội bộ" (internal documents).

To answer this, I will first investigate the existing notification system to understand how it works. Then, I will look for code related to "internal documents" and see if it triggers any notifications.

First, I'll search for the core components of the notification system. Dựa trên yêu cầu của bạn và các tệp trong không gian làm việc, tôi sẽ phân tích chi tiết về hệ thống thông báo của ứng dụng.

### Phân tích tổng thể

Hệ thống thông báo đã được triển khai một cách toàn diện, tích hợp sâu vào các quy trình nghiệp vụ, đặc biệt là quy trình xử lý văn bản nội bộ. Nó không chỉ lưu trữ thông báo trong cơ sở dữ liệu mà còn đẩy thông báo theo thời gian thực đến người dùng cuối thông qua WebSocket.

Dưới đây là các thành phần chính và luồng hoạt động của hệ thống.

### 1. Cấu trúc dữ liệu (Model)

Mọi thông báo trong hệ thống đều được định nghĩa bởi `Notification.java` và các loại của nó được quy định trong `NotificationType.java`.

 Chào bạn, bạn đã nhận định rất chính xác. Dựa trên phân tích mã nguồn, có vẻ như chức năng thông báo cho "văn bản nội bộ" (Internal Document) chưa được triển khai đầy đủ như các loại văn bản khác.

Hãy cùng xem xét chi tiết:

1.  **Luồng thông báo hiện tại**:
    *   `NotificationService` là dịch vụ trung tâm, có khả năng gửi thông báo cho bất kỳ đối tượng `Document` nào.
    *   `DocumentWorkflowService` là nơi chính gọi `NotificationService` mỗi khi có sự thay đổi trạng thái quan trọng của văn bản.

2.  **Sự thiếu vắng trong `DocumentWorkflowService`**:
    *   Vấn đề cốt lõi là `DocumentWorkflowService` hiện tại không được thiết kế để xử lý logic quy trình cho `InternalDocument`. Các phương thức của nó chủ yếu tập trung vào văn bản đến (`IncomingDocument`) và văn bản đi (`OutgoingDocument`).
    *   Do đó, khi một "văn bản nội bộ" được tạo hoặc thay đổi trạng thái, nó không đi qua `DocumentWorkflowService`, dẫn đến việc `NotificationService` không được gọi.

3.  **Cần một Service riêng cho Văn bản nội bộ**:
    *   Để triển khai thông báo, cần phải có một service riêng, ví dụ như `InternalDocumentWorkflowService`, để quản lý vòng đời và các quy trình phê duyệt của văn bản nội bộ.
    *   Service này sẽ chứa các logic nghiệp vụ như: `submitInternalDocument`, `approveInternalDocument`, `rejectInternalDocument`, và quan trọng nhất là gọi `notificationService.createAndSendNotification` tại mỗi bước để thông báo cho những người dùng liên quan.

**Kết luận:**

Việc thiếu thông báo cho văn bản nội bộ không phải là một lỗi, mà là một tính năng chưa được triển-khai. Hệ thống đã có nền tảng (`NotificationService`), nhưng cần bổ sung logic nghiệp vụ cụ thể để tích hợp quy trình xử lý văn bản nội bộ vào hệ thống thông báo chung.

Phambanam99: hãy phân tich #codebase kỹ lưỡng để chuẩn bị triển khai cho  Service riêng cho Văn bản nội bộ

GitHub Copilot: Okay, I will perform a detailed analysis of the codebase to prepare for implementing a separate notification service for "Internal Documents".

Based on your request and the file `REALTIME_NOTIFICATIONS.md`, it's clear the application uses a real-time notification system built with WebSockets. To understand how to implement a new notification service, we first need to thoroughly analyze the existing one.

I will start by locating and examining the core components of the current notification system. I'll search for files related to notifications, such as models, services, repositories, and controllers. Chào bạn, để chuẩn bị cho việc triển khai service riêng cho "Văn bản nội bộ" (Internal Documents), tôi sẽ phân tích kỹ lưỡng hệ thống thông báo hiện tại. Điều này sẽ giúp chúng ta hiểu rõ cách tích hợp tính năng thông báo vào module mới một cách nhất quán.

Dưới đây là các thành phần chính của hệ thống thông báo hiện có:

### 1. Các thành phần cốt lõi

Các file sau đây định nghĩa cấu trúc và hoạt động cơ bản của hệ thống thông báo:

*   **`Notification.java`**: Đây là entity, định nghĩa cấu trúc dữ liệu của một thông báo.
*   **`NotificationType.java`**: Enum này định nghĩa các loại thông báo khác nhau mà hệ thống hỗ trợ, ví dụ: `STATUS_CHANGE`, `NEW_DOCUMENT`, `ASSIGNMENT`.
*   **`NotificationRepository.java`**: Interface này cung cấp các phương thức để tương tác với cơ sở dữ liệu cho các đối tượng `Notification`.
*   **`NotificationController.java`**: Cung cấp các API endpoint để client có thể lấy danh sách thông báo hoặc đánh dấu chúng là đã đọc.
*   **`NotificationService.java`**: Service này chứa logic chính để tạo và gửi thông báo.

### 2. Phân tích chi tiết `NotificationService`

`NotificationService` là trung tâm của hệ thống. Tôi sẽ đọc nội dung của file này để hiểu rõ cách nó hoạt động.

 Chào bạn, để chuẩn bị cho việc triển khai service riêng cho "Văn bản nội bộ", tôi sẽ phân tích kỹ lưỡng hệ thống thông báo hiện tại. Dựa trên tài liệu và cấu trúc mã nguồn, hệ thống này sử dụng WebSocket để gửi thông báo thời gian thực.

Trước hết, tôi sẽ tìm kiếm các thành phần cốt lõi liên quan đến "Notification" để hiểu rõ cách chúng được xây dựng và hoạt động. Chào bạn, để chuẩn bị cho việc triển khai service riêng cho "Văn bản nội bộ", tôi sẽ phân tích chi tiết hệ thống thông báo hiện tại. Điều này sẽ cung cấp một nền tảng vững chắc để bạn có thể tái sử dụng hoặc điều chỉnh cho phù hợp với yêu cầu mới.

Dưới đây là phân tích chi tiết về các thành phần và luồng hoạt động của hệ thống thông báo.

### 1. Tổng quan các thành phần cốt lõi

Hệ thống thông báo được xây dựng dựa trên các thành phần chính sau trong package `com.managementcontent`:

*   **Controller (`NotificationController.java`)**: Cung cấp API để client (frontend) có thể lấy danh sách thông báo và đếm số thông báo chưa đọc.
*   **Service (`NotificationService.java`)**: Là trung tâm xử lý logic, chịu trách nhiệm tạo, lưu trữ và gửi thông báo real-time qua WebSocket.
*   **Repository (`NotificationRepository.java`)**: Tương tác với cơ sở dữ liệu để lưu và truy vấn thông báo.
*   **Model (`Notification.java`, `NotificationType.java`)**: Định nghĩa cấu trúc dữ liệu của một thông báo và các loại thông báo khác nhau.
*   **WebSocket Config (`WebSocketConfig.java`)**: Cấu hình các endpoint và message broker cho việc giao tiếp real-time.

### 2. Phân tích chi tiết luồng hoạt động

#### a. Cấu hình Real-time (WebSocket)

File `src/main/java/com/managementcontent/config/WebSocketConfig.java` thiết lập các kênh giao tiếp:
*   `registerStompEndpoints("/ws")`: Client sẽ kết nối tới WebSocket server thông qua endpoint `/ws`.
*   `enableSimpleBroker("/topic", "/queue")`: Kích hoạt message broker. Các thông báo cho một người dùng cụ thể sẽ được gửi đến các kênh có tiền tố `/queue`.
*   `setApplicationDestinationPrefixes("/app")`: Các tin nhắn từ client gửi lên server sẽ có tiền tố `/app`.

#### b. Tạo và gửi thông báo

Luồng tạo và gửi thông báo tập trung chủ yếu ở `NotificationService`.

*   **`createAndSendNotification(...)`**: Đây là phương thức chính. Nó thực hiện các bước:
    1.  Tạo một đối tượng `Notification` mới với các thông tin cần thiết (người nhận, loại, nội dung, văn bản liên quan).
    2.  Lưu đối tượng `Notification` vào cơ sở dữ liệu thông qua `notificationRepository.save()`.
    3.  Sử dụng `SimpMessagingTemplate` để gửi thông báo tới người dùng cụ thể qua một kênh riêng tư.
        *   `messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/notifications", notificationDto);`
        *   Dòng lệnh này đảm bảo chỉ người dùng (`user.getUsername()`) nhận được thông báo trên kênh `/queue/notifications` của họ.

#### c. Nguồn kích hoạt thông báo

Việc gửi thông báo được kích hoạt từ các quy trình nghiệp vụ liên quan đến văn bản. `DocumentWorkflowService` là nơi chính thực hiện việc này.

*   **`changeDocumentStatus(...)` trong `DocumentWorkflowService.java`**:
    *   Khi trạng thái của một văn bản thay đổi, phương thức này được gọi.
    *   Nó xác định người dùng cần nhận thông báo (ví dụ: người tạo văn bản).
    *   Sau đó, nó gọi `notificationService.createAndSendNotification()` để tạo và gửi thông báo về sự thay đổi trạng thái này.

*   **`assignUserToDocument(...)` trong `DocumentWorkflowService.java`**:
    *   Khi một người dùng được giao xử lý văn bản, phương thức này sẽ được gọi.
    *   Nó gọi `notificationService.createAndSendNotification()` để gửi thông báo `ASSIGNMENT` (giao việc) đến người dùng được giao.

### 3. Các tệp mã nguồn liên quan

Để chuẩn bị cho việc triển khai của bạn, đây là danh sách các tệp quan trọng nhất cần tham khảo:

1.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\service\NotificationService.java`**: Chứa logic cốt lõi về tạo và gửi thông báo. Bạn có thể sẽ tạo một service tương tự hoặc mở rộng service này cho văn bản nội bộ.
2.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\service\DocumentWorkflowService.java`**: Cung cấp ví dụ về cách tích hợp việc gọi `NotificationService` từ trong một quy trình nghiệp vụ. Service cho văn bản nội bộ của bạn cũng sẽ cần gọi đến logic thông báo tại các điểm phù hợp (ví dụ: khi tạo mới, thay đổi trạng thái, giao việc).
3.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\model\Notification.java`**: Model chính của thông báo. Bạn có thể cần thêm các trường mới hoặc một liên kết tới "Văn bản nội bộ" nếu nó là một entity riêng.
4.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\model\enums\NotificationType.java`**: Enum định nghĩa các loại thông báo. Bạn có thể cần thêm các loại mới dành riêng cho văn bản nội bộ (ví dụ: `INTERNAL_DOCUMENT_APPROVAL`, `INTERNAL_DOCUMENT_PUBLISHED`).
5.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\controller\NotificationController.java`**: API để client lấy thông báo. Có thể bạn không cần thay đổi file này nếu cấu trúc thông báo không thay đổi.
6.  **`c:\Users\NamP7\Documents\qlvb\backend-qlvb\src\main\java\com\managementcontent\config\WebSocketConfig.java`**: Cấu hình WebSocket. Thường không cần thay đổi trừ khi có yêu cầu đặc biệt về kênh giao tiếp.

Dựa trên phân tích này, bạn đã có một cái nhìn toàn diện về cách hệ thống thông báo hiện tại hoạt động. Bạn có thể bắt đầu thiết kế service cho "Văn bản nội bộ" bằng cách tái sử dụng các thành phần này và điều chỉnh logic nghiệp vụ cho phù hợp.Chào bạn, để chuẩn bị cho việc triển khai một Service riêng cho "Văn bản nội bộ" (Internal Document) và tích hợp hệ thống thông báo, tôi sẽ tiến hành phân tích kỹ lưỡng các thành phần liên quan trong codebase hiện tại.

Mục tiêu là hiểu rõ cấu trúc hiện có để có thể mở rộng một cách nhất quán và hiệu quả.

### Phân tích các thành phần cốt lõi

1.  **`Document` Model và các loại văn bản:**
    *   Tôi sẽ bắt đầu bằng việc kiểm tra `Document.java` và các lớp kế thừa như `IncomingDocument`, `OutgoingDocument` để hiểu cách hệ thống phân loại và quản lý các loại văn bản khác nhau. Điều này rất quan trọng để xác định xem "Văn bản nội bộ" nên là một loại mới hay một thực thể riêng.

2.  **`DocumentWorkflowService`:**
    *   Đây là service trung tâm điều phối luồng xử lý văn bản. Tôi sẽ phân tích các phương thức chính như `changeDocumentStatus`, `assignDocument`, `approveDocument` để hiểu logic nghiệp vụ và các điểm mà hệ thống gửi đi thông báo. Service này là hình mẫu quan trọng để xây dựng `InternalDocumentService`.

3.  **`NotificationService` và `Notification` Model:**
    *   Tôi sẽ xem xét lại `NotificationService` để xác định cách nó tạo và gửi thông báo. Cụ thể là phương thức `createAndSendNotification` và cách nó sử dụng `SimpMessagingTemplate` để gửi thông báo real-time.
    *   Enum `NotificationType` cũng sẽ được xem xét để quyết định xem có cần thêm các loại thông báo mới dành riêng cho văn bản nội bộ hay không.

4.  **Cấu hình và các thành phần liên quan:**
    *   Tôi sẽ kiểm tra các `Controller` liên quan đến `Document` và `Notification` để hiểu cách chúng tương tác với frontend.
    *   Cấu hình `WebSocketConfig` cũng sẽ được rà soát lại để đảm bảo việc tích hợp real-time cho văn bản nội bộ sẽ diễn ra suôn sẻ.

Sau khi hoàn tất các bước phân tích trên, tôi sẽ có một cái nhìn toàn diện về hệ thống và sẵn sàng đề xuất một kế hoạch chi tiết để triển khai `InternalDocumentService`, bao gồm việc thiết kế model, xây dựng luồng nghiệp vụ, và tích hợp hệ thống thông báo một cách đầy đủ.

Chắc chắn rồi. Dựa trên yêu cầu mới của bạn - `InternalDocument` là một thực thể độc lập và luồng thông báo chỉ tập trung vào việc gửi và xác nhận đã đọc - tôi đã xây dựng một kế hoạch chi tiết.

Kế hoạch này được chia thành hai giai đoạn chính:
1.  **Tái cấu trúc nền tảng:** Làm cho hệ thống thông báo trở nên linh hoạt để có thể hỗ trợ `InternalDocument` và các loại nội dung khác trong tương lai.
2.  **Triển khai logic cụ thể:** Xây dựng các tính năng thông báo dành riêng cho `InternalDocument`.

Dưới đây là các bước chi tiết:

---

### **Giai đoạn 1: Tái cấu trúc nền tảng hệ thống thông báo**

**Mục tiêu:** Gỡ bỏ sự phụ thuộc cứng của `Notification` vào `Document`, cho phép nó liên kết với bất kỳ thực thể nào.

*   **Bước 1.1: Sửa đổi Model `Notification`**
    *   **Việc cần làm:** Mở file Notification.java.
    *   Thay thế trường `private Document document;` bằng hai trường mới:
        *   `private Long entityId;`: Để lưu ID của đối tượng liên quan (ví dụ: ID của `Document` hoặc `InternalDocument`).
        *   `private String entityType;`: Để lưu loại của đối tượng (ví dụ: chuỗi `"document"` hoặc `"internal_document"`).
    *   **Lý do:** Thay đổi này giúp một thông báo có thể trỏ đến bất kỳ bản ghi nào trong cơ sở dữ liệu, làm cho hệ thống trở nên linh hoạt.

*   **Bước 1.2: Sửa đổi `NotificationService`**
    *   **Việc cần làm:** Mở file NotificationService.java.
    *   Thay đổi chữ ký (signature) của phương thức `createAndSendNotification`.
        *   **Từ:** `public void createAndSendNotification(Document document, User user, ...)`
        *   **Thành:** `public void createAndSendNotification(Long entityId, String entityType, User user, ...)`
    *   **Lý do:** Phương thức này giờ đây sẽ nhận vào thông tin định danh chung thay vì một đối tượng `Document` cụ thể, phù hợp với thay đổi ở model.

*   **Bước 1.3: Cập nhật các lời gọi hiện có**
    *   **Việc cần làm:** Trong file DocumentWorkflowService.java, tìm tất cả các vị trí đang gọi `notificationService.createAndSendNotification(...)`.
    *   Cập nhật các lời gọi này để truyền vào `document.getId()` và một chuỗi định danh (ví dụ: `"document"`) thay vì toàn bộ đối tượng `document`.
    *   **Lý do:** Bước này đảm bảo rằng chức năng thông báo cho các văn bản (đến/đi) hiện tại vẫn hoạt động bình thường sau khi tái cấu trúc.

### **Giai đoạn 2: Triển khai logic thông báo cho `InternalDocument`**

**Mục tiêu:** Xây dựng các thông báo theo yêu cầu: "ai gửi cho ai" và "ai đã đọc".

*   **Bước 2.1: Tạo `InternalDocumentService`**
    *   **Việc cần làm:** Tạo một class service mới tên là `InternalDocumentService`.
    *   Service này sẽ chứa toàn bộ logic nghiệp vụ liên quan đến việc gửi, nhận, và đánh dấu đã đọc cho `InternalDocument`. Nó sẽ gọi đến `NotificationService` đã được tái cấu trúc.

*   **Bước 2.2: Triển khai chức năng "Gửi văn bản" và tạo thông báo**
    *   **Việc cần làm:** Trong `InternalDocumentService`, tạo một phương thức, ví dụ `sendDocument(Long internalDocId, List<Long> recipientUserIds)`.
    *   Bên trong phương thức này, với mỗi người nhận trong `recipientUserIds`:
        1.  Lưu thông tin người nhận vào bảng `InternalDocumentRecipient`.
        2.  Gọi `notificationService.createAndSendNotification()` với các tham số:
            *   `entityId`: `internalDocId`
            *   `entityType`: `"internal_document"`
            *   `user`: Đối tượng `User` của người nhận.
            *   `type`: `INTERNAL_DOCUMENT_SENT` (một giá trị enum mới).
            *   `content`: Ví dụ: *"Bạn đã nhận được văn bản nội bộ '[Tiêu đề văn bản]' từ [Tên người gửi]."*

*   **Bước 2.3: Triển khai chức năng "Đánh dấu đã đọc" và tạo thông báo ngược**
    *   **Việc cần làm:** Trong `InternalDocumentService`, tạo một phương thức, ví dụ `markAsRead(Long internalDocId, User currentUser)`.
    *   Phương thức này sẽ:
        1.  Cập nhật trạng thái `isRead = true` cho người nhận (`currentUser`) trong bảng `InternalDocumentRecipient`.
        2.  Gọi `notificationService.createAndSendNotification()` để gửi thông báo **ngược lại cho người gửi**:
            *   `entityId`: `internalDocId`
            *   `entityType`: `"internal_document"`
            *   `user`: Đối tượng `User` của người đã gửi văn bản (`internalDocument.getSender()`).
            *   `type`: `INTERNAL_DOCUMENT_READ` (một giá trị enum mới).
            *   `content`: Ví dụ: *"[Tên người đọc] đã đọc văn bản nội bộ '[Tiêu đề văn bản]' của bạn."*

*   **Bước 2.4: Tạo `InternalDocumentController`**
    *   **Việc cần làm:** Tạo một `RestController` mới để cung cấp các API cho frontend.
    *   Ví dụ các API:
        *   `POST /api/internal-documents/{id}/send`: Gọi đến `internalDocumentService.sendDocument(...)`.
        *   `POST /api/internal-documents/{id}/read`: Gọi đến `internalDocumentService.markAsRead(...)`.

*   **Bước 2.5: Mở rộng Enum `NotificationType`**
    *   **Việc cần làm:** Mở file NotificationType.java.
    *   Thêm các giá trị mới để làm rõ ngữ cảnh thông báo:
        *   `INTERNAL_DOCUMENT_SENT`
        *   `INTERNAL_DOCUMENT_READ`

Kế hoạch này sẽ giúp bạn xây dựng tính năng một cách bài bản, có cấu trúc và dễ dàng mở rộng trong tương lai.