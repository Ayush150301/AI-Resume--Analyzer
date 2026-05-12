import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    try {
    setStatusText("Uploading resume and job details...");

    const uploadedFile = await fs.upload([file]);

    if (!uploadedFile)
      return setStatusText("Failed to upload file. Please try again.");

    setStatusText("Converting to image and extracting text...");

    const imageFile = await convertPdfToImage(file);

    if (!imageFile.file)
      return setStatusText(imageFile.error || "Failed to convert PDF to image. Please try again.");

    setStatusText("Uploading the image ....");

    const uploadedImage = await fs.upload([imageFile.file]);

    if (!uploadedImage)
      return setStatusText("Failed to upload image. Please try again.");

    setStatusText("Preparing Data..... 😊");

    const uuid=generateUUID();
    const data={
      id:uuid,
      resumePath:uploadedFile.path,
      imagePath:uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback:'',
    }
    await kv.set(`resume:${uuid}`,JSON.stringify(data));

    setStatusText('Analyzing.....');

     const feedback=await ai.feedback(
      uploadedFile.path,
      prepareInstructions({jobTitle,jobDescription})
     )

     if(!feedback) return setStatusText("Failed to analyze resume. Please try again.");

     const feedbackText=typeof feedback.message.content==='string'
     ?feedback.message.content
     :feedback.message.content[0].text;


     data.feedback=JSON.parse(feedbackText);

     await kv.set(`resume:${uuid}`,JSON.stringify(data));

     setStatusText(('Analysis complete! Redirecting to results page...'));
     console.log(data);

     navigate(`/resume/${uuid}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;

    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    // console.log({ companyName, jobTitle, jobDescription, file });

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file }).catch(() =>
      setStatusText('An unexpected error occurred. Please try again.')
    );
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart Feedback for your Dream Job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Processing..."
                className="w-full"
              />
            </>
          ) : (
            <h2>Drop your resume for ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  placeholder="Company Name"
                  name="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="Job Title"
                  name="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  id="job-description"
                  placeholder="Job Description"
                  name="job-description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
