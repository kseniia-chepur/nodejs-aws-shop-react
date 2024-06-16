import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, "OAI-policy");

    const siteBucket = new s3.Bucket(this, "AWS-RSS-StaticBucket", {
        bucketName: "aws-rss-shop-react",
        websiteIndexDocument: "index.html",
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
   });

   siteBucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ["S3:GetObject"],
    resources: [siteBucket.arnForObjects("*")],
    principals: [new iam.CanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
   }));

   const distribution = new cloudfront.CloudFrontWebDistribution(this, "aws-rss-distribution", {
    originConfigs: [{
        s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: cloudFrontOAI
        },
        behaviors: [{
            isDefaultBehavior: true
        }]
    }]
   })

    new s3deploy.BucketDeployment(this, "aws-rss-deployment", {
        sources: [s3deploy.Source.asset("../dist")],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ["/*"]
    })
  }
}
