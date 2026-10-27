import type { Locale } from "../i18n/locale";

export type TenseGroup = "present" | "past" | "future";
export type LocalizedText = Record<Locale, string>;
export type GrammarExample = { en: string; vi: string };
export type GrammarForm = { formula: string; example: GrammarExample };
export type GrammarForms = Record<"affirmative" | "negative" | "question", GrammarForm>;
export interface Tense {
    id: string;
    group: TenseGroup;
    name: LocalizedText;
    summary: LocalizedText;
    uses: LocalizedText[];
    markers: string[];
    active: GrammarForms;
    be: { note: LocalizedText; forms?: GrammarForms; example?: GrammarExample };
    passive:
        | { kind: "common"; forms: GrammarForms }
        | { kind: "rare"; formula: string; note: LocalizedText; alternative: GrammarExample };
    mistakes: LocalizedText[];
}

const text = (vi: string, en: string): LocalizedText => ({ vi, en });
const example = (en: string, vi: string): GrammarExample => ({ en, vi });
const form = (formula: string, en: string, vi: string): GrammarForm => ({
    formula,
    example: example(en, vi),
});
const continuousBe = text(
    "Be trong công thức tiếp diễn là trợ động từ. Khi be diễn tả trạng thái (là, ở, cảm thấy…), thường dùng dạng đơn. Being + tính từ có thể diễn tả cách cư xử tạm thời.",
    "In a continuous form, be is an auxiliary. Main-verb be usually takes a simple form for a state. Being + adjective can describe temporary behaviour.",
);
const perfectContinuousBe = text(
    "Không dùng been being để diễn tả trạng thái thông thường. Dùng dạng hoàn thành của be: been + tính từ/danh từ/cụm chỉ nơi chốn. Been trong been + V-ing là một phần của trợ động từ.",
    "Avoid been being for ordinary states. Use perfect be: been + adjective/noun/place phrase. In been + V-ing, been is part of the auxiliary.",
);

export const tenses: Tense[] = [
    {
        id: "present-simple",
        group: "present",
        name: text("Hiện tại đơn", "Present simple"),
        summary: text(
            "Thói quen, sự thật và trạng thái hiện tại.",
            "Habits, facts and present states.",
        ),
        uses: [
            text("Thói quen hoặc hành động lặp lại.", "Habits and repeated actions."),
            text(
                "Sự thật, trạng thái và lịch trình cố định.",
                "Facts, states and fixed timetables.",
            ),
        ],
        markers: ["always", "usually", "often", "sometimes", "never", "every day"],
        active: {
            affirmative: form(
                "S + V / V-s/es",
                "Mia walks to work every day.",
                "Mia đi bộ đi làm mỗi ngày.",
            ),
            negative: form(
                "S + do/does + not + V",
                "Mia does not drive to work.",
                "Mia không lái xe đi làm.",
            ),
            question: form(
                "Do/Does + S + V?",
                "Does Mia work nearby?",
                "Mia có làm việc gần đây không?",
            ),
        },
        be: {
            note: text(
                "I → am; he/she/it → is; you/we/they → are. Không thêm do/does với be.",
                "I → am; he/she/it → is; you/we/they → are. Do not add do/does to be.",
            ),
            forms: {
                affirmative: form("S + am/is/are + C", "Mia is a nurse.", "Mia là y tá."),
                negative: form(
                    "S + am/is/are + not + C",
                    "Mia is not at home.",
                    "Mia không ở nhà.",
                ),
                question: form("Am/Is/Are + S + C?", "Is Mia busy?", "Mia có bận không?"),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + am/is/are + V3 (+ by O)",
                    "The doors are locked at night.",
                    "Các cửa được khóa vào ban đêm.",
                ),
                negative: form(
                    "S + am/is/are + not + V3",
                    "The doors are not locked during the day.",
                    "Các cửa không bị khóa vào ban ngày.",
                ),
                question: form(
                    "Am/Is/Are + S + V3?",
                    "Are the doors locked at ten?",
                    "Các cửa có được khóa lúc mười giờ không?",
                ),
            },
        },
        mistakes: [
            text(
                "He works, nhưng Does he work? Sau does dùng động từ nguyên mẫu, không thêm -s.",
                "He works, but Does he work? Use the base verb after does, without -s.",
            ),
            text(
                "Trạng từ tần suất thường đứng trước động từ thường, nhưng sau be: She often reads. She is often busy.",
                "Frequency adverbs usually precede main verbs but follow be: She often reads. She is often busy.",
            ),
        ],
    },
    {
        id: "present-continuous",
        group: "present",
        name: text("Hiện tại tiếp diễn", "Present continuous"),
        summary: text(
            "Việc đang diễn ra hoặc tình huống tạm thời.",
            "Actions in progress and temporary situations.",
        ),
        uses: [
            text(
                "Hành động đang diễn ra lúc nói hoặc quanh hiện tại.",
                "Actions happening now or around the present.",
            ),
            text(
                "Tình huống tạm thời, sự thay đổi hoặc kế hoạch đã sắp xếp.",
                "Temporary situations, changes and arranged future plans.",
            ),
        ],
        markers: ["now", "right now", "at the moment", "currently", "these days"],
        active: {
            affirmative: form(
                "S + am/is/are + V-ing",
                "I am preparing dinner now.",
                "Tôi đang chuẩn bị bữa tối.",
            ),
            negative: form(
                "S + am/is/are + not + V-ing",
                "I am not using the oven.",
                "Tôi không đang dùng lò nướng.",
            ),
            question: form("Am/Is/Are + S + V-ing?", "Are you making soup?", "Bạn đang nấu súp à?"),
        },
        be: {
            note: continuousBe,
            example: example(
                "He is being unusually quiet today.",
                "Hôm nay anh ấy tỏ ra ít nói khác thường.",
            ),
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + am/is/are + being + V3",
                    "Dinner is being prepared.",
                    "Bữa tối đang được chuẩn bị.",
                ),
                negative: form(
                    "S + am/is/are + not + being + V3",
                    "The oven is not being used.",
                    "Lò nướng không đang được sử dụng.",
                ),
                question: form(
                    "Am/Is/Are + S + being + V3?",
                    "Is the soup being heated?",
                    "Súp đang được hâm nóng à?",
                ),
            },
        },
        mistakes: [
            text(
                "Không bỏ be: I am cooking, không phải I cooking. Make → making; run → running.",
                "Keep be: I am cooking, not I cooking. Make → making; run → running.",
            ),
            text(
                "Các động từ trạng thái như know, own, believe thường không dùng dạng tiếp diễn với nghĩa trạng thái.",
                "State verbs such as know, own and believe usually avoid continuous forms in their state meanings.",
            ),
        ],
    },
    {
        id: "present-perfect",
        group: "present",
        name: text("Hiện tại hoàn thành", "Present perfect"),
        summary: text(
            "Việc trước hiện tại có liên hệ với hiện tại.",
            "Past events connected to the present.",
        ),
        uses: [
            text(
                "Kinh nghiệm đến nay hoặc kết quả còn liên quan hiện tại, không nêu thời điểm quá khứ đã kết thúc.",
                "Experience up to now or a present result, without a finished past time.",
            ),
            text(
                "Trạng thái bắt đầu trong quá khứ và còn tiếp tục; sự kiện trong khoảng thời gian chưa kết thúc.",
                "States continuing from the past and events within an unfinished period.",
            ),
        ],
        markers: ["already", "just", "yet", "ever", "never", "so far", "since", "for"],
        active: {
            affirmative: form(
                "S + have/has + V3",
                "I have sent the invitation.",
                "Tôi đã gửi lời mời rồi.",
            ),
            negative: form(
                "S + have/has + not + V3",
                "Lena has not replied yet.",
                "Lena vẫn chưa trả lời.",
            ),
            question: form(
                "Have/Has + S + V3?",
                "Have you checked your inbox?",
                "Bạn đã kiểm tra hộp thư chưa?",
            ),
        },
        be: {
            note: text(
                "Dạng quá khứ phân từ của be là been. Dùng have/has been cho trạng thái kéo dài đến hiện tại.",
                "The past participle of be is been. Use have/has been for a state continuing to now.",
            ),
            forms: {
                affirmative: form(
                    "S + have/has + been + C",
                    "She has been ill since Monday.",
                    "Cô ấy bị ốm từ thứ Hai đến giờ.",
                ),
                negative: form(
                    "S + have/has + not + been + C",
                    "She has not been at work this week.",
                    "Tuần này cô ấy chưa đi làm.",
                ),
                question: form(
                    "Have/Has + S + been + C?",
                    "Has she been ill for long?",
                    "Cô ấy bị ốm lâu chưa?",
                ),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + have/has + been + V3",
                    "The invitation has been sent.",
                    "Lời mời đã được gửi.",
                ),
                negative: form(
                    "S + have/has + not + been + V3",
                    "The date has not been confirmed yet.",
                    "Ngày tổ chức vẫn chưa được xác nhận.",
                ),
                question: form(
                    "Have/Has + S + been + V3?",
                    "Have the guests been informed?",
                    "Các khách mời đã được thông báo chưa?",
                ),
            },
        },
        mistakes: [
            text(
                "Dùng quá khứ đơn với yesterday, last week, in 2020 khi chỉ thời điểm đã kết thúc.",
                "Use the past simple with yesterday, last week or in 2020 for a finished past time.",
            ),
            text(
                "Since + mốc bắt đầu; for + khoảng thời gian. Hai từ này không chỉ xuất hiện với hiện tại hoàn thành.",
                "Since introduces a starting point; for introduces a duration. They are not exclusive to this form.",
            ),
        ],
    },
    {
        id: "present-perfect-continuous",
        group: "present",
        name: text("Hiện tại hoàn thành tiếp diễn", "Present perfect continuous"),
        summary: text(
            "Nhấn mạnh quá trình kéo dài đến hiện tại.",
            "An activity continuing up to now.",
        ),
        uses: [
            text(
                "Hoạt động bắt đầu trước đây và vẫn đang tiếp diễn, nhấn mạnh thời lượng.",
                "An activity that started earlier and is still continuing, with a focus on duration.",
            ),
            text(
                "Hoạt động vừa dừng nhưng còn dấu vết hoặc tác động ở hiện tại.",
                "A recently stopped activity with visible present evidence or effects.",
            ),
        ],
        markers: ["for two hours", "since this morning", "all day", "lately", "recently"],
        active: {
            affirmative: form(
                "S + have/has + been + V-ing",
                "We have been painting the kitchen all morning.",
                "Chúng tôi đã sơn bếp suốt buổi sáng.",
            ),
            negative: form(
                "S + have/has + not + been + V-ing",
                "We have not been working on the bedrooms.",
                "Chúng tôi không làm ở các phòng ngủ trong thời gian vừa qua.",
            ),
            question: form(
                "Have/Has + S + been + V-ing?",
                "Have you been painting for long?",
                "Bạn sơn lâu chưa?",
            ),
        },
        be: {
            note: perfectContinuousBe,
            example: example("I have been tired all week.", "Tôi thấy mệt cả tuần nay."),
        },
        passive: {
            kind: "rare",
            formula: "S + have/has + been + being + V3",
            note: text(
                "Dạng bị động này có thể tạo về ngữ pháp nhưng rất ít dùng. Thường giữ câu chủ động; nếu đổi sang bị động hoàn thành, sắc thái nhấn mạnh quá trình sẽ thay đổi.",
                "This passive is grammatically possible but rarely used. Prefer the active; a perfect passive changes the emphasis from process to result.",
            ),
            alternative: example(
                "The kitchen has been partly painted.",
                "Căn bếp đã được sơn một phần. (Chuyển trọng tâm sang kết quả.)",
            ),
        },
        mistakes: [
            text(
                "Muốn nói số lượng hoặc việc đã hoàn tất, thường dùng hiện tại hoàn thành: I have painted two rooms.",
                "For quantities or completion, usually use the present perfect simple: I have painted two rooms.",
            ),
            text(
                "Với trạng thái, dùng I have known her for years, không phải have been knowing.",
                "For a state, use I have known her for years, not have been knowing.",
            ),
        ],
    },
    {
        id: "past-simple",
        group: "past",
        name: text("Quá khứ đơn", "Past simple"),
        summary: text(
            "Sự việc đã kết thúc trong quá khứ.",
            "Completed events in a finished past time.",
        ),
        uses: [
            text(
                "Sự việc hoặc trạng thái ở một thời điểm quá khứ đã kết thúc.",
                "Events or states at a finished time in the past.",
            ),
            text(
                "Chuỗi hành động kể chuyện và thói quen trong quá khứ.",
                "Sequences in a story and past habits.",
            ),
        ],
        markers: ["yesterday", "last night", "two days ago", "in 2019", "when I was young"],
        active: {
            affirmative: form(
                "S + V2 / V-ed",
                "We visited the museum yesterday.",
                "Hôm qua chúng tôi tham quan bảo tàng.",
            ),
            negative: form(
                "S + did + not + V",
                "We did not buy any souvenirs.",
                "Chúng tôi không mua món quà lưu niệm nào.",
            ),
            question: form(
                "Did + S + V?",
                "Did you enjoy the exhibition?",
                "Bạn có thích buổi triển lãm không?",
            ),
        },
        be: {
            note: text(
                "I/he/she/it → was; you/we/they → were. Không dùng did với be trong câu hỏi/phủ định thông thường.",
                "I/he/she/it → was; you/we/they → were. Ordinary questions and negatives with be do not use did.",
            ),
            forms: {
                affirmative: form(
                    "S + was/were + C",
                    "The museum was crowded.",
                    "Bảo tàng lúc đó rất đông.",
                ),
                negative: form(
                    "S + was/were + not + C",
                    "The tickets were not expensive.",
                    "Vé lúc đó không đắt.",
                ),
                question: form(
                    "Was/Were + S + C?",
                    "Was the guide helpful?",
                    "Hướng dẫn viên lúc đó có nhiệt tình không?",
                ),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + was/were + V3",
                    "The museum was opened in 1998.",
                    "Bảo tàng được khánh thành năm 1998.",
                ),
                negative: form(
                    "S + was/were + not + V3",
                    "The old paintings were not moved.",
                    "Những bức tranh cũ đã không bị di chuyển.",
                ),
                question: form(
                    "Was/Were + S + V3?",
                    "Was the building restored last year?",
                    "Tòa nhà có được trùng tu năm ngoái không?",
                ),
            },
        },
        mistakes: [
            text(
                "Sau did/did not dùng V nguyên mẫu: Did she go?, không phải Did she went?.",
                "After did/did not use the base form: Did she go?, not Did she went?.",
            ),
            text(
                "Động từ bất quy tắc cần học riêng: go → went → gone; không phải động từ nào cũng thêm -ed.",
                "Learn irregular verbs separately: go → went → gone. Not every verb takes -ed.",
            ),
        ],
    },
    {
        id: "past-continuous",
        group: "past",
        name: text("Quá khứ tiếp diễn", "Past continuous"),
        summary: text(
            "Việc đang diễn ra tại một thời điểm quá khứ.",
            "An action in progress at a past time.",
        ),
        uses: [
            text(
                "Hành động đang diễn ra tại một mốc quá khứ hoặc làm nền cho một sự kiện khác.",
                "An action in progress at a past time or background to another event.",
            ),
            text(
                "Hai hành động đang diễn ra song song trong quá khứ.",
                "Two activities in progress at the same past time.",
            ),
        ],
        markers: ["at eight last night", "at that moment", "while", "when"],
        active: {
            affirmative: form(
                "S + was/were + V-ing",
                "I was reading when the lights went out.",
                "Tôi đang đọc sách thì đèn tắt.",
            ),
            negative: form(
                "S + was/were + not + V-ing",
                "My brother was not sleeping then.",
                "Lúc ấy em trai tôi không ngủ.",
            ),
            question: form(
                "Was/Were + S + V-ing?",
                "Were you using the computer at eight?",
                "Bạn có đang dùng máy tính lúc tám giờ không?",
            ),
        },
        be: {
            note: continuousBe,
            example: example(
                "He was being rude during the meeting.",
                "Anh ấy cư xử thô lỗ trong cuộc họp lúc đó.",
            ),
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + was/were + being + V3",
                    "The road was being repaired when we arrived.",
                    "Con đường đang được sửa khi chúng tôi đến.",
                ),
                negative: form(
                    "S + was/were + not + being + V3",
                    "The lights were not being checked then.",
                    "Lúc ấy các bóng đèn không được kiểm tra.",
                ),
                question: form(
                    "Was/Were + S + being + V3?",
                    "Was the bridge being repaired?",
                    "Cây cầu có đang được sửa không?",
                ),
            },
        },
        mistakes: [
            text(
                "Việc làm nền thường dùng tiếp diễn; sự việc xen vào thường dùng quá khứ đơn. Không áp dụng máy móc cho mọi câu có when/while.",
                "Background often takes the continuous; an interrupting event often takes the simple past. When/while do not mechanically determine the form.",
            ),
            text(
                "Phân biệt was working (chủ động) với was being repaired (bị động).",
                "Distinguish was working (active) from was being repaired (passive).",
            ),
        ],
    },
    {
        id: "past-perfect",
        group: "past",
        name: text("Quá khứ hoàn thành", "Past perfect"),
        summary: text(
            "Việc xảy ra trước một mốc quá khứ khác.",
            "An event before another past reference point.",
        ),
        uses: [
            text(
                "Nhìn lại một việc đã xảy ra trước một sự kiện hoặc thời điểm quá khứ khác.",
                "Looking back at an event before another past event or time.",
            ),
            text(
                "Trạng thái kéo dài đến một mốc quá khứ; làm rõ nguyên nhân của tình huống quá khứ.",
                "A state lasting up to a past point, or the earlier cause of a past situation.",
            ),
        ],
        markers: ["before", "after", "by the time", "already", "until then"],
        active: {
            affirmative: form(
                "S + had + V3",
                "The train had left before we reached the station.",
                "Tàu đã rời đi trước khi chúng tôi tới ga.",
            ),
            negative: form(
                "S + had + not + V3",
                "I had not checked the timetable.",
                "Trước đó tôi chưa kiểm tra lịch tàu.",
            ),
            question: form(
                "Had + S + V3?",
                "Had you booked the tickets in advance?",
                "Bạn đã đặt vé trước đó chưa?",
            ),
        },
        be: {
            note: text(
                "Had been dùng cho mọi chủ ngữ; trạng thái được nhìn từ một mốc quá khứ.",
                "Had been works with every subject; the state is viewed from a past reference point.",
            ),
            forms: {
                affirmative: form(
                    "S + had + been + C",
                    "She had been awake for hours before the alarm rang.",
                    "Cô ấy đã thức nhiều giờ trước khi chuông báo thức reo.",
                ),
                negative: form(
                    "S + had + not + been + C",
                    "We had not been there before that trip.",
                    "Trước chuyến đi đó, chúng tôi chưa từng đến đó.",
                ),
                question: form(
                    "Had + S + been + C?",
                    "Had he been ill before the trip?",
                    "Anh ấy có bị ốm trước chuyến đi không?",
                ),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + had + been + V3",
                    "The tickets had been sold before we arrived.",
                    "Vé đã được bán hết trước khi chúng tôi tới.",
                ),
                negative: form(
                    "S + had + not + been + V3",
                    "The timetable had not been updated.",
                    "Trước đó lịch tàu chưa được cập nhật.",
                ),
                question: form(
                    "Had + S + been + V3?",
                    "Had the passengers been warned?",
                    "Các hành khách đã được cảnh báo trước đó chưa?",
                ),
            },
        },
        mistakes: [
            text(
                "Không cần quá khứ hoàn thành cho mọi hành động xảy ra trước; dùng khi cần thể hiện góc nhìn từ một mốc quá khứ.",
                "Not every earlier event needs the past perfect; use it when a past reference point matters.",
            ),
            text(
                "Had đi với V3: had gone, không phải had went.",
                "Had takes V3: had gone, not had went.",
            ),
        ],
    },
    {
        id: "past-perfect-continuous",
        group: "past",
        name: text("Quá khứ hoàn thành tiếp diễn", "Past perfect continuous"),
        summary: text(
            "Quá trình kéo dài trước một mốc quá khứ.",
            "An activity continuing up to a past point.",
        ),
        uses: [
            text(
                "Nhấn mạnh thời lượng của hoạt động diễn ra đến một mốc quá khứ.",
                "Emphasising the duration of an activity up to a past point.",
            ),
            text(
                "Hoạt động trước đó giải thích dấu vết hoặc kết quả trong quá khứ.",
                "An earlier activity explaining evidence or a result in the past.",
            ),
        ],
        markers: ["for an hour before…", "since dawn", "all morning", "by the time"],
        active: {
            affirmative: form(
                "S + had + been + V-ing",
                "We had been hiking for three hours when it started to rain.",
                "Chúng tôi đã đi bộ đường dài được ba giờ thì trời bắt đầu mưa.",
            ),
            negative: form(
                "S + had + not + been + V-ing",
                "I had not been sleeping well before the trip.",
                "Trước chuyến đi tôi ngủ không được ngon trong một thời gian.",
            ),
            question: form(
                "Had + S + been + V-ing?",
                "Had you been waiting long when the bus came?",
                "Bạn đã chờ lâu chưa khi xe buýt đến?",
            ),
        },
        be: {
            note: perfectContinuousBe,
            example: example(
                "She had been anxious all day before the results arrived.",
                "Cô ấy đã lo lắng cả ngày trước khi có kết quả.",
            ),
        },
        passive: {
            kind: "rare",
            formula: "S + had + been + being + V3",
            note: text(
                "Hiếm dùng vì chuỗi been being nặng nề. Nên giữ chủ động hoặc viết lại với quá khứ tiếp diễn bị động và diễn đạt thời lượng riêng; cách viết lại không giữ nguyên hoàn toàn sắc thái.",
                "Rare because been being is cumbersome. Prefer the active or rephrase using a past continuous passive and a separate duration; the aspectual emphasis changes.",
            ),
            alternative: example(
                "The path was being repaired when we arrived; work had started two hours earlier.",
                "Đường mòn đang được sửa khi chúng tôi đến; công việc đã bắt đầu hai giờ trước đó.",
            ),
        },
        mistakes: [
            text(
                "Cần hiểu mốc quá khứ tham chiếu: had been waiting nói thời gian chờ tính đến một thời điểm trước đây, không phải đến bây giờ.",
                "Identify the past reference point: had been waiting measures waiting up to a past time, not up to now.",
            ),
            text(
                "Nếu nhấn mạnh số lượng hoặc hoàn tất, dùng quá khứ hoàn thành: We had walked ten kilometres.",
                "For quantity or completion, use the past perfect simple: We had walked ten kilometres.",
            ),
        ],
    },
    {
        id: "future-simple",
        group: "future",
        name: text("Tương lai đơn", "Future simple"),
        summary: text(
            "Dự đoán, quyết định tức thời và lời hứa với will.",
            "Predictions, instant decisions and promises with will.",
        ),
        uses: [
            text(
                "Dự đoán, lời hứa, lời đề nghị giúp đỡ hoặc quyết định lúc nói.",
                "Predictions, promises, offers and decisions made while speaking.",
            ),
            text(
                "Một sự việc trong tương lai được nhìn như một toàn thể.",
                "A future event viewed as a whole.",
            ),
        ],
        markers: ["tomorrow", "next week", "soon", "in a few days", "I think", "probably"],
        active: {
            affirmative: form(
                "S + will + V",
                "I will carry that bag for you.",
                "Tôi sẽ xách chiếc túi đó giúp bạn.",
            ),
            negative: form(
                "S + will + not + V",
                "I will not forget your address.",
                "Tôi sẽ không quên địa chỉ của bạn.",
            ),
            question: form(
                "Will + S + V?",
                "Will you call me tomorrow?",
                "Ngày mai bạn sẽ gọi tôi chứ?",
            ),
        },
        be: {
            note: text(
                "Sau will dùng be nguyên mẫu cho mọi chủ ngữ. Will not thường rút gọn thành won't.",
                "Use base-form be after will for every subject. Will not commonly contracts to won't.",
            ),
            forms: {
                affirmative: form(
                    "S + will + be + C",
                    "I will be at the station at six.",
                    "Tôi sẽ ở ga lúc sáu giờ.",
                ),
                negative: form(
                    "S + will + not + be + C",
                    "The journey will not be long.",
                    "Chuyến đi sẽ không dài.",
                ),
                question: form(
                    "Will + S + be + C?",
                    "Will you be ready by six?",
                    "Bạn sẽ sẵn sàng trước hoặc đúng sáu giờ chứ?",
                ),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + will + be + V3",
                    "Your bag will be delivered tomorrow.",
                    "Túi của bạn sẽ được giao ngày mai.",
                ),
                negative: form(
                    "S + will + not + be + V3",
                    "You will not be charged for delivery.",
                    "Bạn sẽ không bị tính phí giao hàng.",
                ),
                question: form(
                    "Will + S + be + V3?",
                    "Will the parcel be delivered before noon?",
                    "Bưu kiện sẽ được giao trước trưa chứ?",
                ),
            },
        },
        mistakes: [
            text(
                "Sau will dùng V nguyên mẫu, không thêm -s hoặc to: She will help.",
                "After will use the base verb, without -s or to: She will help.",
            ),
            text(
                "Be going to thường diễn đạt ý định có trước/dự đoán có bằng chứng; hiện tại tiếp diễn thường dùng cho việc đã sắp xếp. Không phải mọi việc tương lai đều dùng will.",
                "Be going to often expresses prior intention or evidence-based prediction; present continuous often expresses arrangements. Future time does not always require will.",
            ),
        ],
    },
    {
        id: "future-continuous",
        group: "future",
        name: text("Tương lai tiếp diễn", "Future continuous"),
        summary: text(
            "Việc sẽ đang diễn ra tại một mốc tương lai.",
            "An activity in progress at a future point.",
        ),
        uses: [
            text(
                "Hành động sẽ đang diễn ra tại một thời điểm tương lai.",
                "An action that will be in progress at a future time.",
            ),
            text(
                "Hoạt động dự kiến theo tiến trình hoặc một tình huống tạm thời trong tương lai.",
                "An expected activity in the normal course of events or a temporary future situation.",
            ),
        ],
        markers: [
            "this time tomorrow",
            "at nine tomorrow",
            "when you arrive",
            "all evening tomorrow",
        ],
        active: {
            affirmative: form(
                "S + will + be + V-ing",
                "This time tomorrow, I will be flying to Hanoi.",
                "Giờ này ngày mai tôi sẽ đang bay đến Hà Nội.",
            ),
            negative: form(
                "S + will + not + be + V-ing",
                "I will not be using my phone during the flight.",
                "Tôi sẽ không dùng điện thoại trong chuyến bay.",
            ),
            question: form(
                "Will + S + be + V-ing?",
                "Will you be waiting at the airport?",
                "Bạn sẽ đang đợi ở sân bay chứ?",
            ),
        },
        be: {
            note: text(
                "Will be + V-ing có be làm trợ động từ. Với trạng thái tương lai, thường dùng will be + C; tránh will be being + tính từ trong cách diễn đạt thông thường.",
                "In will be + V-ing, be is auxiliary. For a future state, normally use will be + C rather than will be being + adjective.",
            ),
            example: example(
                "I will be on the plane at this time tomorrow.",
                "Giờ này ngày mai tôi sẽ ở trên máy bay.",
            ),
        },
        passive: {
            kind: "rare",
            formula: "S + will + be + being + V3",
            note: text(
                "Có thể tạo nhưng ít dùng. Giữ chủ động để nhấn mạnh việc đang diễn ra. Will be + V3 là cách bị động tự nhiên hơn khi không cần giữ sắc thái tiếp diễn.",
                "Possible but uncommon. Keep the active to emphasise an ongoing action. Will be + V3 is a more natural passive when the continuous emphasis is unnecessary.",
            ),
            alternative: example(
                "The luggage will be loaded at nine.",
                "Hành lý sẽ được xếp lên lúc chín giờ. (Không nhấn mạnh việc đang diễn ra.)",
            ),
        },
        mistakes: [
            text(
                "Không bỏ be: will be travelling, không phải will travelling.",
                "Keep be: will be travelling, not will travelling.",
            ),
            text(
                "Trong mệnh đề thời gian chỉ tương lai với when/while, thường dùng dạng hiện tại: I will be waiting when you arrive.",
                "Future time clauses with when/while normally use a present form: I will be waiting when you arrive.",
            ),
        ],
    },
    {
        id: "future-perfect",
        group: "future",
        name: text("Tương lai hoàn thành", "Future perfect"),
        summary: text(
            "Việc sẽ hoàn tất trước hoặc vào một mốc tương lai.",
            "Completion by a future reference point.",
        ),
        uses: [
            text(
                "Việc sẽ hoàn tất trước hoặc chậm nhất tại một thời điểm tương lai.",
                "An event completed before or no later than a future point.",
            ),
            text(
                "Trạng thái tính đến một mốc tương lai, thường đi với thời lượng.",
                "A state viewed up to a future point, often with a duration.",
            ),
        ],
        markers: ["by Friday", "by then", "by the time", "before next month"],
        active: {
            affirmative: form(
                "S + will + have + V3",
                "We will have finished the report by Friday.",
                "Chúng tôi sẽ hoàn thành báo cáo chậm nhất vào thứ Sáu.",
            ),
            negative: form(
                "S + will + not + have + V3",
                "I will not have checked every figure by noon.",
                "Đến trưa tôi vẫn sẽ chưa kiểm tra hết mọi số liệu.",
            ),
            question: form(
                "Will + S + have + V3?",
                "Will you have sent it by five?",
                "Bạn sẽ gửi xong nó chậm nhất lúc năm giờ chứ?",
            ),
        },
        be: {
            note: text(
                "Will have been diễn đạt trạng thái nhìn từ một thời điểm tương lai; không dùng has sau will.",
                "Will have been expresses a state viewed from a future point. Never use has after will.",
            ),
            forms: {
                affirmative: form(
                    "S + will + have + been + C",
                    "By June, we will have been married for ten years.",
                    "Đến tháng Sáu, chúng tôi sẽ kết hôn được mười năm.",
                ),
                negative: form(
                    "S + will + not + have + been + C",
                    "By then, he will not have been here for a full year.",
                    "Đến lúc đó, anh ấy vẫn sẽ chưa ở đây đủ một năm.",
                ),
                question: form(
                    "Will + S + have + been + C?",
                    "Will she have been in London for a year by May?",
                    "Đến tháng Năm, cô ấy sẽ ở Luân Đôn được một năm chứ?",
                ),
            },
        },
        passive: {
            kind: "common",
            forms: {
                affirmative: form(
                    "S + will + have + been + V3",
                    "The report will have been reviewed by Friday.",
                    "Báo cáo sẽ được duyệt xong chậm nhất vào thứ Sáu.",
                ),
                negative: form(
                    "S + will + not + have + been + V3",
                    "The figures will not have been checked by noon.",
                    "Đến trưa các số liệu vẫn sẽ chưa được kiểm tra xong.",
                ),
                question: form(
                    "Will + S + have + been + V3?",
                    "Will the report have been approved by then?",
                    "Báo cáo sẽ được phê duyệt xong trước lúc đó chứ?",
                ),
            },
        },
        mistakes: [
            text(
                "By là hạn chót; until nói sự kéo dài đến một mốc. Không thay thế hai từ một cách máy móc.",
                "By marks a deadline; until marks continuation up to a point. They are not interchangeable.",
            ),
            text(
                "Dùng hiện tại trong mệnh đề by the time chỉ tương lai: By the time you arrive, I will have finished.",
                "Use a present form in a future by the time clause: By the time you arrive, I will have finished.",
            ),
        ],
    },
    {
        id: "future-perfect-continuous",
        group: "future",
        name: text("Tương lai hoàn thành tiếp diễn", "Future perfect continuous"),
        summary: text(
            "Thời lượng của quá trình tính đến một mốc tương lai.",
            "The duration of an activity up to a future point.",
        ),
        uses: [
            text(
                "Nhấn mạnh một hoạt động sẽ đã kéo dài bao lâu khi tới một mốc tương lai.",
                "Emphasising how long an activity will have continued by a future point.",
            ),
            text(
                "Hoạt động có thể vẫn tiếp diễn tại mốc đó hoặc vừa dừng trước đó; trọng tâm là quá trình, không phải số lượng hoàn tất.",
                "The activity may still be continuing or have just stopped at that point; the focus is process, not a completed quantity.",
            ),
        ],
        markers: ["by next month … for…", "by the time … for…", "for ten years by June"],
        active: {
            affirmative: form(
                "S + will + have + been + V-ing",
                "By June, I will have been teaching here for ten years.",
                "Đến tháng Sáu, tôi sẽ đã dạy ở đây được mười năm.",
            ),
            negative: form(
                "S + will + not + have + been + V-ing",
                "By noon, we will not have been travelling for a full hour yet.",
                "Đến trưa, chúng tôi vẫn sẽ chưa đi được đủ một giờ.",
            ),
            question: form(
                "Will + S + have + been + V-ing?",
                "Will you have been working here for a year by May?",
                "Đến tháng Năm, bạn sẽ làm ở đây được một năm chứ?",
            ),
        },
        be: {
            note: perfectContinuousBe,
            example: example(
                "By June, I will have been a teacher for ten years.",
                "Đến tháng Sáu, tôi sẽ làm giáo viên được mười năm.",
            ),
        },
        passive: {
            kind: "rare",
            formula: "S + will + have + been + being + V3",
            note: text(
                "Chuỗi trợ động từ này rất hiếm trong thực tế. Nên giữ chủ động hoặc chia thành hai câu. Không coi đây là mẫu bị động cần dùng thường xuyên.",
                "This auxiliary sequence is extremely rare in practice. Prefer the active or split the idea into two sentences; it is not a practical everyday passive pattern.",
            ),
            alternative: example(
                "The school will still be under renovation in June. Work will have been in progress for a year.",
                "Đến tháng Sáu, trường vẫn sẽ đang được cải tạo. Công việc lúc đó sẽ đã diễn ra được một năm.",
            ),
        },
        mistakes: [
            text(
                "Cần cả mốc tương lai và ý thời lượng trong ngữ cảnh. Không dùng chỉ vì thấy for.",
                "The context needs a future reference point and a duration. For alone does not require this form.",
            ),
            text(
                "Muốn nhấn mạnh việc hoàn tất, dùng tương lai hoàn thành: I will have written three chapters by Friday.",
                "For completion, use the future perfect simple: I will have written three chapters by Friday.",
            ),
        ],
    },
];
