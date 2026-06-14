const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// ========== 解析用户提供的表格数据 ==========
const rawData = `商业视频	九州建设	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/1e4386a2-17f4ebcde23/1e4386a2-17f4ebcde23.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg\`	[{"insert":"\\n"}]	1	是	8	宣传片
商业视频	公园大道地产	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/34195211-17f4ebfaa49/34195211-17f4ebfaa49.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/c32cec002a864127a2b3331c6daefbba/snapshots/fae978c4feb14eaaa9b6256e8d8a9d1a-00006.jpg\`	[{"insert":"\\n"}]	13	否	0	信息流广告
商业视频	中荷人寿好爸好妈会	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3d3fc4d6-17f4ec3c777/3d3fc4d6-17f4ec3c777.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/c23373eaa624415e8c22bf9f111289eb/snapshots/b0fd856094a5486f83f71088b875de91-00007.jpg\`	[{"insert":"\\n"}]	3		0	宣传片
商业视频	了缘	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/42b5ab32-17f4ec0b4d6/42b5ab32-17f4ec0b4d6.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f8c44fcd843c44e0bff4b27d5f10f8fd/snapshots/76ee1c7b499043e0b4563d55819fa9ef-00002.jpg\`		4		0	微电影
商业视频	大工人文社会与科学学部宣传片	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5c950338-17f4ebd73cc/5c950338-17f4ebd73cc.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/131546d915514118a72805d8fd73c1ff/snapshots/3e5fd40453fb45b4adb74bc41a5507d5-00002.jpg\`	[{"insert":"\\n"}]	5		0	宣传片
商业视频	八比特科技有限公司	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/60f046b8-17f4ebc1571/60f046b8-17f4ebc1571.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/ACBF6B13819D4AF38BB1241B783CC3E6-6-2.png\`		6		0	宣传片
商业视频	英特工程仿真技术（大连）有限公司	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5570922f-17f4ec1f7e8/5570922f-17f4ec1f7e8.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/5FA3421D03A644F083BADD11B17D839E-6-2.png\`		7		0	宣传片
商业视频	红旗h5	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/139dbf0b-17f4ec0a005/139dbf0b-17f4ec0a005.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/62cbeff731f74b7f843aebad1146c104/snapshots/458a378feceb43ca863ff00f0aea0624-00001.jpg\`		8		0	广告
商业视频	小维智能视频门铃	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/479b6c61-17f4ec1d7c8/479b6c61-17f4ec1d7c8.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/33bcd7900b224234a38c0a17cde4338a/snapshots/48381b74a5034184b9bb1fbda9f8ab33-00001.jpg\`		9		0	产品广告
商业视频	宁夏蓝海大宗商品交易中心	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5a82f5e-17f4ec1040b/5a82f5e-17f4ec1040b.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/aaa00bb7e86e455fbd1c6fcd9d322eaa/snapshots/8918e993ae914a6393a0327bb51f317e-00001.jpg\`		10		0	广告
商业视频	大连银行服务形象宣传片	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/8a2e100-17f4ebe9c71/8a2e100-17f4ebe9c71.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/fd82fabf37f04ca3abb772203ef4da55/snapshots/90d001bf69c04e3db76fe34ea869aa6c-00001.jpg\`		11		0	形象宣传片
商业视频	裕景中心—中心价值	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/17e7c826-17f4ec351ba/17e7c826-17f4ec351ba.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0fb6502201e341c4a377c06fc5111681/snapshots/2f0fa776970d4380aad2067179a06905-00003.jpg\`		12		0	短视频广告
商业视频	中荷人寿要客通	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/369a28ec-17f4ec3d829/369a28ec-17f4ec3d829.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/fb98ef3ed3ca4c81bf9d853617f3c866/snapshots/b7bcc6f97365463dae69f174a2ba0205-00001.jpg\`	[{"insert":"\\n"}]	2		0	广告
专题视频	听她说——佩璇·时光守艺人	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/15db2639-17f4ecb2adc/15db2639-17f4ecb2adc.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg\`		8	是	5	人物志
专题视频	百名党员追寻百年足迹	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/4b26d0f1-17f4ec3fa38/4b26d0f1-17f4ec3fa38.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/6cdce4a64fe24c88bf4dd95ba8690fb8/snapshots/a2298170b8df4ab2a934896b4df2ad57-00002.jpg\`		3	否	0	党建
专题视频	毛泽东长征诗词	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/315a229b-17f4ec85f3a/315a229b-17f4ec85f3a.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/7b0a6f069531420096806a87b8c6d0ef/snapshots/d2358fc2a428402a80e56e98fefde814-00003.jpg\`		9	否	0	党课
专题视频	垃圾分类，我们在行动	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/de5e22-17f4ec81996/de5e22-17f4ec81996.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0166181d5371494b839205f374d9ac0f/snapshots/49e85a3b6e4b4a109c569815526a62f5-00003.jpg\`		10	否	0	公益视频
专题视频	青春	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/818a24f-17f4ec8cbbc/818a24f-17f4ec8cbbc.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/74da9070217b4f918cb133a040103b33/snapshots/486ad6c7afbc415f85ea4c14a537b9c4-00007.jpg\`		5	否	0	混剪
专题视频	大连港湾海关抗疫	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/104ccbb0-17f4ec54531/104ccbb0-17f4ec54531.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f69c3bbb55314ccead106ed0cfdff6b8/snapshots/805ed081cbe5431da4e10c4102632ec3-00005.jpg\`		11	否	0	公益视频
动画	翼兴信息高校安防	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/42d8ffb9-17f4eb4f2e5/42d8ffb9-17f4eb4f2e5.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/a6eb5dffa6a84141b9f9dd019034009f/snapshots/67ef48ef74e14b609fa02df9dfdccd97-00005.jpg\`		1	否	0	MG动画
动画	大工计算机类（中外合作）专业	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/58d8d2e5-17f4eb4f2d1/58d8d2e5-17f4eb4f2d1.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/2beebff4c4de434bbbfb7a5d273ab84e/snapshots/6facb9ba5f834c8d8236c1b7f3cc4a70-00006.jpg\`		2	否	0	MG动画
动画	边界猎手APP演示	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5a774327-17f4eb4f376/5a774327-17f4eb4f376.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg\`		3	是	5	演示动画
动画	自动驾驶模拟仿真平台	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/2388dc94-17f4eb4f318/2388dc94-17f4eb4f318.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/08b1fc79a9de48e8a7f4ec38f6d39ca0/snapshots/7f295211d5f942e8ac1604a8159a8dc3-00004.jpg\`		4	否	0	竞赛申报演示动画
动画	基因快速检测技术	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/58ba77f8-17f4eb4f2d5/58ba77f8-17f4eb4f2d5.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/87fb2f08a9e44824802ef138e5b5ab7c/snapshots/21a7389e9f4b485286fad1a30e892db1-00003.jpg\`	[{"insert":"\\n"}]	5	否	0	竞赛申报演示动画
活动配套	我和我的祖国	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/27b56883-17f4eb67387/27b56883-17f4eb67387.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/269f5e708a614dc49195ee63cd4f18bc/snapshots/201e65153ae9459ab1dafde23adb41b4-00004.jpg\`		9	否	0	合唱展播
活动配套	壮丽七十年 放歌新时代	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3529d0eb-17f4eb78df1/3529d0eb-17f4eb78df1.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/fa3718749d6049c783655472b2761b39/snapshots/10975f625d7644e3a6a8f80d6713a66b-00003.jpg\`		10	否	0	现场活动实录
活动配套	招行相亲会	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/e5945a3-17f4eb6f9fa/e5945a3-17f4eb6f9fa.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/7e3aff3da4f8440cbe6996f06932e508/snapshots/b9ab5cdc455c49c4be981405966b417d-00005.jpg\`		8	否	5	活动集锦
课程建设	高级新闻写作	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5db92c3e-17f4eb798d1/5db92c3e-17f4eb798d1.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/940e2bc6f0e04f8ca7a0bcc0bcea464f/snapshots/b5a8c5763a8f4be4ab8b3327df3fc1a3-00007.jpg\`		9	否	6	课程申报
课程建设	化工设备机械基础	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/25b8bbd6-17f4eb861dd/25b8bbd6-17f4eb861dd.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ebee9251995443fd8dc86d3c2f90eb2b/snapshots/5d61bbef069d4ca18d9ad6bde294e3ac-00007.jpg\`		2	否	0	课程申报
课程建设	融媒环境下音视频新闻报道的简练性	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/14eb77a7-17f4ebb9adc/14eb77a7-17f4ebb9adc.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/07c94d0bbaa94a70be144e5f0697665c/snapshots/b567050deea4432ea6e143367fd98176-00005.jpg\`		3	否	0	课程实录
课程建设	表面无损检测原理	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/76bbf4b-17f4eb794c8/76bbf4b-17f4eb794c8.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/3ccdefb170e94130b0a5c4af464018d0/snapshots/ce87756817644242bde398d6385a2eff-00007.jpg\`		4	否	0	课程申报
课程建设	化工实验课	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5ad79852-17f4eb884f5/5ad79852-17f4eb884f5.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/8a5dc819b4ab4afabe8b84d88314194f/snapshots/ecf5c466ace64e569de461a1f948edf0-00003.jpg\`		5	否	0	实验实录
课程建设	面包板与电子器件常见问题	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/b62f8d6-17f4eba8ae3/b62f8d6-17f4eba8ae3.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5fef69215dd646b095e1fafa27951159/snapshots/4358277bbe0449c69b29353608b9618c-00004.jpg\`		6	否	0	教学演示
专题视频	服务在路上	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/36ef4ce3-17fd9c78034/36ef4ce3-17fd9c78034.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/3671d61d1cff441898529904805b87af/snapshots/d57e52e2628343659a91da0b69c7d833-00004.jpg\`	[{"insert":"\\n"}]	12		0	宣传视频
课程建设	基础日语课程	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/e7d5b1f-1809dea9eb4/e7d5b1f-1809dea9eb4.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/8b7e82fd4a24432ca06e3d47d1834c22/snapshots/9050af0d215940ceb3d402a4eb107045-00008.jpg\`	[{"insert":"\\n"}]	7		0	慕课
专题视频	大连市沙河口区工会职工服务中心	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/5007c012-180fa7a5190/5007c012-180fa7a5190.mp4\`	R10799137-73adca336c339020a0cfbc20179af566_757407_1920_1080.png		2		0	宣传视频
活动配套	MV-夜空中最亮的星-太平洋保险	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/39ed1ddd-181e23592fb/39ed1ddd-181e23592fb.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/d94037d8857f412f823ebd1fa15fa0c4/snapshots/f17a83652939423686eba3c8fa709461-00005.jpg\`	[{"insert":"\\n"}]	4		0	音乐微电影
活动配套	连理再见-大连理工大学毕业季MV	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/342c81dc-181e23592fa/342c81dc-181e23592fa.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/2648a292185542158faefb9bcca6e225/snapshots/47da98b24f024f66b3ab21f2db8642bd-00003.jpg\`	[{"insert":"\\n"}]	3		0	音乐微电影
活动配套	大连理工大学院长大直播预热视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/56686a96-181e23592fc/56686a96-181e23592fc.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/a92984b9f66342418b463cc3a11575c7/snapshots/d7e48c4e81b046999ad9e38759caa411-00001.jpg\`	[{"insert":"\\n"}]	2		0	活动预热
活动配套	大连理工大学2022届毕业演讲会开场视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/1a44a36-181e23592fd/1a44a36-181e23592fd.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ed76eace6a364749a3ff5fb25bdd97b8/snapshots/85b5d48c8c564c63b0bee6bb2116bf19-00004.jpg\`		5		0	活动开场视频
活动配套	感谢有你-毕业季特别企划	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3d124cd5-181e2359302/3d124cd5-181e2359302.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/8870dcb7be234bebbecf49ad8964b202/snapshots/3dd2cea586b9452f88d18a8e42bde5ee-00003.jpg\`	[{"insert":"\\n"}]	1		0	活动预热
活动配套	再见-大连理工大学毕业季MV（辅导员）	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/4921dc49-181e237a093/4921dc49-181e237a093.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/c745c33581264bd1a77ae6433dcd9066/snapshots/ff42e7bf6fe64effb3adef65015e83b9-00002.jpg\`		6		0	音乐微电影
活动配套	太平洋保险专题视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/4956b7d8-181e24f1b83/4956b7d8-181e24f1b83.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/dc88e0881413434680daf4dbdfc03600/snapshots/abf8e8e0795f485ca5cc021882e8500b-00002.jpg\`		7		0	素材加工
活动配套	大连理工大学-东京工业大学友好交流15周	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/56f9ea21-181e280ca10/56f9ea21-181e280ca10.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/C13E13F34D5D443D8FA3406884D48509-6-2.png\`	[{"insert":"\\n"}]	8		0	活动宣传
专题视频	大连理工大学五一劳动教育公开课	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3f8ed4c2-181e289a5fb/3f8ed4c2-181e289a5fb.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/c1d6d2933f9444df84d713170544b891/snapshots/1bd9bb0e3dd64d41b430147b42a85309-00002.jpg\`		7		0	专题节目
专题视频	大连理工大学招生宣讲视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/48bb1635-181e28d82f9/48bb1635-181e28d82f9.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/2b9eb0f454664c1d96b0c5ec84407a5f/snapshots/0a8b5cdaf77c4034a5d4194c23de7075-00002.jpg\`		4		0	招生宣讲
专题视频	大连理工大学校庆特别企划节目	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/45e2f2e2-181e293b7a9/45e2f2e2-181e293b7a9.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/fd302fcc3dea4c45ac903a361d9f3054/snapshots/f3c165b284e8448e8944ca4330e812e2-00008.jpg\`		1		0	专题节目
课程建设	专题思政课	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3bb9553b-181e29b34f4/3bb9553b-181e29b34f4.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg\`		1	是	3	慕课
专题视频	大连理工大学高性能制造团队介绍视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/593be6a4-181e29b3501/593be6a4-181e29b3501.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5c45ec1efa6546059cb73583542ed760/snapshots/85339dd256c545779c2dea9d355d1529-00002.jpg\`		9		0	团队展示
专题视频	弘扬劳模精神专题党课	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/78333d9-181e29b350a/78333d9-181e29b350a.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png\`		6	是	4	党课
商业视频	慕乐网络形象宣传片	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/413aa927-181e29b3505/413aa927-181e29b3505.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/8620210f13ff4ffe826d2e406315109f/snapshots/8d4856f899fc42e2a2ef0ece0056c78d-00002.jpg\`		1		0	宣传片
专题视频	大连理工大学人才宣传片	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/34e03034-1865d6dc22d/34e03034-1865d6dc22d.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png\`	[{"insert":"\\n"}]	1	是	1	活动视频
专题视频	玉兰	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/4f926d36-187786efb0d/4f926d36-187786efb0d.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/D74323BE993A4E879C2CE0FDEF16C42C-6-2.png\`	[{"insert":"\\n"}]	2	是	2	专题视频
专题视频	大连理工大学2023级毕业MV	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/bd5109f-189d44e9a87/bd5109f-189d44e9a87.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg\`	[{"insert":"\\n"}]	1	是	3	活动视频
专题视频	大连理工大学毕业生演讲会宣传视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/20dec25a-189d44ee0bd/20dec25a-189d44ee0bd.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5cb11fe035c771ee951f7fb2780c0102/snapshots/acf2163dbac146a79ad7dad3c3c35851-00007.jpg\`		1	是	3	活动视频
专题视频	大连理工大学招生宣传视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/1ee00ed0-189d452be9c/1ee00ed0-189d452be9c.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3bb81a035c771ee93f835a6ecca0102/snapshots/0f6c7dcac2a74513a328fcc82195498b-00003.jpg\`		1	是	3	活动视频
专题视频	大连理工大学国旗护卫队形象视频	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/2f4d2f33-189d452beaf/2f4d2f33-189d452beaf.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3c063a035c771eebfd16eb3690d0102/snapshots/fd25f7510856491c88ed365b660ef168-00004.jpg\`		1	是	3	活动视频
专题视频	大连理工大学人才引进形象宣传片	\`https://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/sv/3d6f8471-189d472e4ea/3d6f8471-189d472e4ea.mp4\`	\`http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/db95c45035cc71eebff425b7edcb0102/snapshots/f50bea479cdb48a6a474149730dc7357-00004.jpg\`	[{"insert":"\\n"}]	1	是	3	活动视频`;

// 解析函数：去除反引号
function stripBackticks(str) {
  if (!str) return '';
  return str.replace(/`/g, '').trim();
}

// 解析表格数据
const lines = rawData.split('\n');
const portfolioItems = [];
const featuredList = [];

lines.forEach((line, idx) => {
  const cols = line.split('\t');
  if (cols.length < 9) return;

  const category = cols[0].trim();
  const title = cols[1].trim();
  const videoUrl = stripBackticks(cols[2]);
  let img = stripBackticks(cols[3]);
  const sortOrder = parseInt(cols[5]) || 0;
  const isFeatured = cols[6] === '是';
  const featuredOrder = parseInt(cols[7]) || 0;
  const tag = cols[8] ? cols[8].trim() : '';

  // 如果封面图不是URL，可能是本地图片路径，给它加个默认处理
  if (img && !img.startsWith('http')) {
    // 本地图片文件名，保持原样
    img = img;
  }

  portfolioItems.push({
    title: title,
    category: category,
    tag: tag,
    shortDesc: tag,
    fullDesc: '',
    img: img,
    images: null,
    videoUrl: videoUrl,
    type: 'video',
    color: '',
    bgGlow: '',
    hidden: 0,
    sortOrder: sortOrder
  });

  if (isFeatured) {
    featuredList.push({
      title: title,
      featuredOrder: featuredOrder
    });
  }
});

console.log(`共解析 ${portfolioItems.length} 个作品，其中 ${featuredList.length} 个精选作品`);

// ========== 开始数据库操作 ==========
db.serialize(() => {
  // 1. 清空现有数据
  db.run('DELETE FROM featured_works');
  db.run('DELETE FROM portfolio_items');
  console.log('已清空 portfolio_items 和 featured_works 表');

  // 2. 插入新作品
  const stmt = db.prepare('INSERT INTO portfolio_items (title, category, tag, shortDesc, fullDesc, img, images, videoUrl, type, color, bgGlow, hidden, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  portfolioItems.forEach(item => {
    stmt.run(
      item.title, item.category, item.tag, item.shortDesc, item.fullDesc,
      item.img, item.images, item.videoUrl, item.type, item.color, item.bgGlow,
      item.hidden, item.sortOrder
    );
  });

  stmt.finalize();
  console.log(`已插入 ${portfolioItems.length} 个作品`);

  // 3. 插入精选作品
  db.all('SELECT id, title FROM portfolio_items', (err, rows) => {
    if (err) {
      console.error('查询作品失败:', err);
      db.close();
      return;
    }

    const featuredStmt = db.prepare('INSERT INTO featured_works (id, portfolioId, sortOrder) VALUES (?, ?, ?)');
    let featuredCount = 0;

    featuredList.forEach((feat, idx) => {
      const matched = rows.find(r => r.title === feat.title);
      if (matched) {
        featuredStmt.run(`fw${Date.now()}${idx}`, matched.id, feat.featuredOrder);
        featuredCount++;
      } else {
        console.warn(`找不到匹配的作品标题: "${feat.title}"`);
      }
    });

    featuredStmt.finalize();
    console.log(`已插入 ${featuredCount} 个精选作品`);

    // 4. 重置自增ID
    db.run('DELETE FROM sqlite_sequence WHERE name="portfolio_items"', () => {
      // 5. 统计查询
      db.all('SELECT * FROM portfolio_items', (err, items) => {
        if (err) {
          console.error('查询失败:', err);
        } else {
          console.log(`\n=== 最终统计 ===`);
          console.log(`总作品数: ${items.length}`);
          
          // 按分类统计
          const catStats = {};
          items.forEach(item => {
            catStats[item.category] = (catStats[item.category] || 0) + 1;
          });
          console.log('\n按分类统计:');
          Object.keys(catStats).forEach(cat => {
            console.log(`  ${cat}: ${catStats[cat]}`);
          });
        }

        db.close();
        console.log('\n数据迁移完成！');
      });
    });
  });
});
