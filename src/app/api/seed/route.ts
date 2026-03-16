// app/api/seed/route.ts
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";

export async function GET() {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const hf = new HfInference(process.env.HF_TOKEN!);

    // Dummy knowledge base - replace this with your actual data later!
    // Replace your old documents array with this in app/api/seed/route.ts:

    const documents = [
      // --- GENERAL PLATFORM INFO ---
      "Internify is a two-sided, AI-enabled learning-to-hiring platform that bridges the gap between university training and industry needs. It hosts authentic, employer-contributed tasks to give students practical experience.",
      "Internify replaces generic badges and standard bootcamps with trusted, employer-verified credentials. It aims to reduce hiring friction by aligning demonstrable skills with real-world expectations.",
      "The platform features curated challenges from local Egyptian institutions like ITI, NTI, and Debi, as well as global technology partners like Microsoft and IBM.",

      // --- FOR STUDENTS: TASKS & AI FEEDBACK ---
      "Students on Internify can browse, select, and submit solutions to tasks provided by real employers. Tasks are categorized by skill, industry, and difficulty level.",
      "When a student submits a task, Internify's integrated AI system automatically grades the submission based on predefined criteria and provides automated, actionable feedback to highlight areas of improvement.",
      "To protect credential integrity, Internify uses strict anti-cheat mechanisms during task submission and evaluation.",

      // --- FOR STUDENTS: PORTFOLIOS & CERTIFICATES ---
      "Upon successful completion of a task, students receive verifiable, company-branded certificates. These certificates include a tamper-proof digital signature to prevent unauthorized alterations.",
      "Students can use Internify to automatically generate dynamic CVs and personalized mini-portfolios. These portfolios are built directly from their successfully completed tasks and verified skills.",

      // --- FOR EMPLOYERS: POSTING TASKS & BRANDING ---
      "Employers use Internify to create a direct, scalable pipeline to evaluate junior candidates based on demonstrable skills, rather than just reading standard resumes.",
      "Employers have full control to post, update, and retire tasks on the platform. All tasks must be validated by the employer before being published to ensure they accurately evaluate candidate skills.",
      "Employers can enhance their corporate branding and CSR programs by associating their company logo with the tasks and issuing branded certificates to successful students.",

      // --- FOR EMPLOYERS: HIRING & FILTERING ---
      "Employers can filter and review student profiles based on their completed tasks, verified skills, and AI-generated portfolios.",
      "Internify serves as a high-fidelity pre-screening instrument for hiring funnels. Employers have the option to directly engage with and contact verified talent through the platform for potential job placements.",

      // --- HOW TO (STUDENT UI INSTRUCTIONS) ---
      "To explore and accept a new task, navigate to the Student Dashboard and click 'Explore Tasks' in the top navigation bar. You can search by keywords or filter by Category and Skill Level on the left sidebar.",
      "To accept a task, click the blue 'View' button on a task card in the Explore Tasks page to open the details pane, then click 'Accept Task' at the bottom of the drawer.",
      "To view your active pipeline and accepted tasks, go to the Student Dashboard's main 'Dashboard' tab. It displays your active tasks, progress, and recommended top matches.",
      "To generate your dynamic CV, click your profile initial at the top right corner to open the dropdown menu, select 'Profile', and then click the green 'Generate CV' button on your profile card.",
      "To edit your student profile, navigate to your Profile page from the top-right account menu, and click the blue 'Edit Profile' button to update your title, location, description, links, and skills.",
      "To view your completed tasks and task history, visit your Profile page where passed applications are listed under the 'Completed Tasks' section alongside your skills.",
      "To change settings or log out as a student, click your profile initial in the top right corner to open the dropdown menu, and select 'Settings' or 'Log out'.",

      // --- HOW TO (EMPLOYER UI INSTRUCTIONS) ---
      "To post a new task, go to the Employer Dashboard and click 'Post Task' in the top navigation bar, or click the 'Post New Task' button in the dashboard hero header. This will open a modal to fill in task details.",
      "When posting a task, you will need to provide a Title, Category, Skill Level (beginner, intermediate, advanced), Description, required Skills, Deadline, Maximum Applicants, and optional attachments or images.",
      "To review task submissions and task analytics, go to the main Employer Dashboard. You will see your active tasks under the Task Management section, as well as an Analytics Panel summarizing submission metrics and quality scores.",
      "To search for verified talent, navigate to the 'Talent Search' tab in the top navigation bar of the Employer Dashboard to browse student profiles based on their verified competencies.",
      "To edit or delete an existing task, go to the Employer Dashboard, click on a task in the Task Management panel to open its details, and select the 'Edit' or 'Delete' actions.",
      "To change settings or log out as an employer, click your profile initial in the top right corner to open the dropdown menu, and select 'Settings' or 'Log out'.",
    ];

    console.log("Starting to seed database...");

    for (let i = 0; i < documents.length; i++) {
      const text = documents[i];
      console.log(`\nGenerating embedding for document ${i + 1}...`);

      const embeddingResponse = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
      });

      // SAFETY CHECK: Ensure Hugging Face actually returned an array
      if (!Array.isArray(embeddingResponse)) {
        console.error("Hugging Face API Error:", embeddingResponse);
        return NextResponse.json(
          {
            error:
              "Hugging Face returned an error instead of a vector. See terminal.",
            details: embeddingResponse,
          },
          { status: 500 },
        );
      }

      // Safely extract the 1D array of numbers
      let vector: number[];
      if (Array.isArray(embeddingResponse[0])) {
        vector = embeddingResponse[0] as number[];
      } else {
        vector = embeddingResponse as number[];
      }

      console.log(`Success! Vector length: ${vector.length}`);

      // Save to Pinecone
      // Save to Pinecone
      await index.upsert({
        records: [
          {
            id: `doc-${i}`,
            values: vector,
            metadata: { text: text },
          },
        ],
      });
    }

    console.log("Seeding complete!");
    return NextResponse.json({
      message: "Successfully added data to Pinecone!",
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 },
    );
  }
}
